import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';
import deepseekService from '../services/deepseek.js';

/**
 * Get client dashboard data
 */
export const getClientDashboard = async (req, res) => {
    try {
        const clientId = req.user._id;

        // Get urgency threshold from settings
        const settingsSnap = await db.ref('systemSettings')
            .orderByChild('key')
            .equalTo('urgencyThreshold')
            .limitToFirst(1)
            .once('value');

        let urgencyThreshold = 70;
        if (settingsSnap.exists()) {
            const settings = queryToArray(settingsSnap);
            urgencyThreshold = settings[0].value;
        }

        // Get all client cases
        const casesSnap = await db.ref('cases')
            .orderByChild('clientId')
            .equalTo(clientId)
            .once('value');
        const allCases = queryToArray(casesSnap);

        const totalCases = allCases.length;
        const activeCases = allCases.filter(c => ['submitted', 'assigned', 'in_review', 'in_progress', 'pending_acceptance', 'pending_advocate', 'analyzing', 'advocate_assigned'].includes(c.status)).length;
        const urgentCases = allCases.filter(c =>
            (c.aiAnalysis?.urgencyScore >= urgencyThreshold) &&
            !['completed', 'closed', 'cancelled'].includes(c.status)
        ).length;
        const resolvedCases = allCases.filter(c => ['completed', 'closed', 'resolved'].includes(c.status)).length;

        // Recent cases (sorted by updatedAt desc)
        const recentCases = allCases
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
            .slice(0, 5);

        // Get client notifications
        const allNotifSnap = await db.ref('notifications')
            .orderByChild('userId')
            .equalTo(clientId)
            .once('value');

        let notifications = queryToArray(allNotifSnap);

        // Filter unread count
        const unreadNotifications = notifications.filter(n => n.isRead === false).length;
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        notifications = notifications.slice(0, 5);

        res.json({
            success: true,
            data: {
                stats: {
                    totalCases,
                    activeCases,
                    urgentCases,
                    resolvedCases
                },
                recentCases,
                unreadNotifications,
                notifications,
                advocateWarning: null,
                hasUrgent: urgentCases > 0
            }
        });

    } catch (error) {
        console.error('Client dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
};

/**
 * Get client's cases
 */
export const getClientCases = async (req, res) => {
    try {
        const clientId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        // Fetch cases by client
        const casesSnap = await db.ref('cases')
            .orderByChild('clientId')
            .equalTo(clientId)
            .once('value');

        let cases = queryToArray(casesSnap);

        if (status) {
            cases = cases.filter(c => c.status === status);
        }

        // Sort by updatedAt desc
        cases.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

        const totalCases = cases.length;

        // Paginate
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        cases = cases.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                cases,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCases / parseInt(limit)),
                    totalCases,
                    hasMore: page * limit < totalCases
                }
            }
        });

    } catch (error) {
        console.error('Get client cases error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cases' });
    }
};

/**
 * Submit new case
 */
export const submitCase = async (req, res) => {
    try {
        const clientId = req.user._id;
        const { title, description, category, location } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, error: 'Title and description are required' });
        }

        const caseId = generateId();
        const newCase = {
            clientId,
            title,
            description,
            category: category || 'Other',
            location: location || {},
            status: 'submitted',
            urgencyLevel: 'medium',
            aiAnalysis: {},
            timeline: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Run AI analysis
        try {
            const [classificationResult, urgencyResult] = await Promise.all([
                deepseekService.classifyCase(description, { location }),
                deepseekService.detectUrgency(description, category)
            ]);

            if (classificationResult?.success) {
                newCase.aiAnalysis.classification = classificationResult.data;
                if (classificationResult.data?.confidence > 80) {
                    newCase.aiAnalysis.suggestedCategory = classificationResult.data.category;
                }
            }

            if (urgencyResult?.success) {
                newCase.urgencyLevel = urgencyResult.data?.urgencyLevel || 'medium';
                newCase.aiAnalysis.urgencyScore = urgencyResult.data?.urgencyScore || 50;
                newCase.aiAnalysis.urgencyLevel = urgencyResult.data?.urgencyLevel || 'medium';
                newCase.aiAnalysis.urgencyDetails = urgencyResult.data;
            }

            // Log AI interactions (fire and forget)
            Promise.all([
                deepseekService.logInteraction(clientId, 'classification', description, classificationResult, caseId),
                deepseekService.logInteraction(clientId, 'urgency', description, urgencyResult, caseId)
            ]).catch(err => console.error('AI logging error:', err));

        } catch (aiError) {
            console.warn('AI analysis failed:', aiError.message);
            newCase.aiAnalysis = { note: 'AI analysis pending' };
        }

        await db.ref('cases/' + caseId).set(newCase);

        // Log activity
        try {
            await db.ref('activityLogs').push({
                userId: clientId,
                action: 'case_create',
                entityType: 'case',
                entityId: caseId,
                details: { title, category },
                createdAt: new Date().toISOString()
            });
        } catch (e) { /* ignore */ }

        // Create notification
        try {
            await db.ref('notifications').push({
                userId: clientId,
                type: 'case_submitted',
                title: 'Case Submitted Successfully',
                message: `Your case "${title}" has been submitted and is being analyzed.`,
                data: { caseId },
                isRead: false,
                createdAt: new Date().toISOString()
            });
        } catch (e) { /* ignore */ }

        res.status(201).json({
            success: true,
            data: {
                case: { _id: caseId, ...newCase },
                aiAnalysis: newCase.aiAnalysis
            }
        });

    } catch (error) {
        console.error('Submit case error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit case' });
    }
};

/**
 * Get advocate recommendations for a case
 */
export const getAdvocateRecommendations = async (req, res) => {
    try {
        const { caseId } = req.params;
        const clientId = req.user._id;

        const caseSnapshot = await db.ref('cases/' + caseId).once('value');
        if (!caseSnapshot.exists() || caseSnapshot.val().clientId !== clientId) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }
        const caseData = { _id: caseSnapshot.key, ...caseSnapshot.val() };

        // Get all advocates (filtering for verified/active locally as RTDB query is limited)
        const advSnap = await db.ref('advocates').once('value');

        let advocates = queryToArray(advSnap);
        advocates = advocates.filter(a => a.isVerified === true && a.isActive === true);

        // Enrich with user info
        for (let adv of advocates) {
            if (adv.userId) {
                const uSnap = await db.ref('users/' + adv.userId).once('value');
                if (uSnap.exists()) {
                    adv.userName = uSnap.val().name;
                    adv.userEmail = uSnap.val().email;
                }
            }
        }

        if (advocates.length === 0) {
            return res.json({ success: true, data: { recommendations: [], message: 'No available advocates' } });
        }

        // Build recommendations (simple score-based)
        const recommendations = advocates
            .map(adv => ({
                advocate: {
                    id: adv._id,
                    name: adv.userName || adv.barCouncilId,
                    specialization: adv.specialization,
                    experienceYears: adv.experienceYears,
                    rating: adv.rating,
                    successRate: adv.successRate,
                    location: adv.location,
                    feeRange: adv.feeRange
                },
                matchScore: Math.round(((adv.rating || 3) * 10 + (adv.successRate || 70)) / 2),
                matchReasons: ['Available', 'Verified advocate'],
                concerns: []
            }))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                case: { id: caseData._id, title: caseData.title, category: caseData.category },
                recommendations,
                totalAvailable: advocates.length
            }
        });

    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ success: false, error: 'Failed to get recommendations' });
    }
};

/**
 * Hire advocate for a case
 */
export const hireAdvocate = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { advocateId } = req.body;
        const clientId = req.user._id;

        const caseSnapshot = await db.ref('cases/' + caseId).once('value');
        if (!caseSnapshot.exists() || caseSnapshot.val().clientId !== clientId) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseSnapshot.val();
        if (caseData.advocateId) {
            return res.status(400).json({ success: false, error: 'Case already has an assigned advocate' });
        }

        const advSnapshot = await db.ref('advocates/' + advocateId).once('value');
        if (!advSnapshot.exists() || !advSnapshot.val().isVerified) {
            return res.status(400).json({ success: false, error: 'Advocate not available' });
        }

        // Update case
        await db.ref('cases/' + caseId).update({
            advocateId,
            status: 'pending_acceptance',
            updatedAt: new Date().toISOString()
        });

        // Notify advocate
        const advData = advSnapshot.val();
        await db.ref('notifications').push({
            userId: advData.userId,
            type: 'case_request',
            title: 'New Case Request',
            message: `You have a new case request: "${caseData.title}"`,
            data: { caseId },
            isRead: false,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Hire request sent to advocate',
            data: { case: { _id: caseId, ...caseData, advocateId, status: 'pending_acceptance' } }
        });

    } catch (error) {
        console.error('Hire advocate error:', error);
        res.status(500).json({ success: false, error: 'Failed to hire advocate' });
    }
};
