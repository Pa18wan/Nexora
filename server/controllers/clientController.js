import Case from '../models/Case.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import Advocate from '../models/Advocate.js';
import SystemSettings from '../models/SystemSettings.js';
import deepseekService from '../services/deepseek.js';

/**
 * Get client dashboard data
 */
export const getClientDashboard = async (req, res) => {
    try {
        const clientId = req.user._id;

        // Get urgency threshold from settings
        const urgencySettings = await SystemSettings.findOne({ key: 'urgencyThreshold' });
        const urgencyThreshold = urgencySettings?.value || 70;

        // Get case statistics
        const [totalCases, activeCases, urgentCases, resolvedCases] = await Promise.all([
            Case.countDocuments({ clientId }),
            Case.countDocuments({ clientId, status: { $in: ['submitted', 'assigned', 'in_review', 'in_progress'] } }),
            Case.countDocuments({
                clientId,
                'aiAnalysis.urgencyScore': { $gte: urgencyThreshold },
                status: { $nin: ['completed', 'closed', 'cancelled'] }
            }),
            Case.countDocuments({ clientId, status: { $in: ['completed', 'closed'] } })
        ]);

        // Get recent cases
        const recentCases = await Case.find({ clientId })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('advocateId', 'name rating')
            .select('title category status urgencyLevel aiAnalysis.aiMatchScore updatedAt');

        // Get unread notifications
        const unreadNotifications = await Notification.countDocuments({ userId: clientId, read: false });

        // Get recent notifications
        const notifications = await Notification.find({ userId: clientId })
            .sort({ createdAt: -1 })
            .limit(5);

        // Check for inactive advocate warning
        let advocateWarning = null;
        const casesWithAdvocate = await Case.find({
            clientId,
            advocateId: { $exists: true },
            status: { $in: ['assigned', 'in_review', 'in_progress'] }
        }).populate('advocateId');

        for (const caseItem of casesWithAdvocate) {
            if (caseItem.advocateId && caseItem.advocateId.lastActiveAt) {
                const hoursSinceActive = (Date.now() - caseItem.advocateId.lastActiveAt) / (1000 * 60 * 60);
                if (hoursSinceActive > 24) {
                    advocateWarning = {
                        caseId: caseItem._id,
                        caseTitle: caseItem.title,
                        advocateName: caseItem.advocateId.name,
                        hoursSinceActive: Math.floor(hoursSinceActive)
                    };
                    break;
                }
            }
        }

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
                advocateWarning,
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
        const { page = 1, limit = 10, status, urgency, sortBy = 'urgencyScore' } = req.query;

        const query = { clientId };

        if (status) {
            query.status = status;
        }

        if (urgency) {
            const urgencySettings = await SystemSettings.findOne({ key: 'urgencyThreshold' });
            const threshold = urgencySettings?.value || 70;

            if (urgency === 'high') {
                query['aiAnalysis.urgencyScore'] = { $gte: threshold };
            } else if (urgency === 'low') {
                query['aiAnalysis.urgencyScore'] = { $lt: threshold };
            }
        }

        // Sort by urgency first, then by updatedAt
        const sortOptions = {};
        if (sortBy === 'urgencyScore') {
            sortOptions['aiAnalysis.urgencyScore'] = -1;
        }
        sortOptions.updatedAt = -1;

        const cases = await Case.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('advocateId', 'name rating specialization')
            .select('-aiAnalysis.embedding');

        const totalCases = await Case.countDocuments(query);

        res.json({
            success: true,
            data: {
                cases,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCases / limit),
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

        console.log('Submitting case:', { title, category, descriptionLength: description?.length });

        if (!title || !description) {
            return res.status(400).json({ success: false, error: 'Title and description are required' });
        }

        // Create case
        const newCase = new Case({
            clientId,
            title,
            description,
            category: category || 'Other',
            location: location || {},
            status: 'submitted',
            urgencyLevel: 'medium'
        });

        // Run AI analysis (optional - don't fail if AI is unavailable)
        try {
            const [classificationResult, urgencyResult] = await Promise.all([
                deepseekService.classifyCase(description, { location }),
                deepseekService.detectUrgency(description, category)
            ]);

            // Store AI analysis
            if (classificationResult && classificationResult.success) {
                newCase.aiAnalysis = newCase.aiAnalysis || {};
                newCase.aiAnalysis.classification = classificationResult.data;

                // Override category if AI is confident
                if (classificationResult.data?.confidence > 80 && classificationResult.data?.category !== category) {
                    newCase.aiAnalysis.suggestedCategory = classificationResult.data.category;
                }
            }

            if (urgencyResult && urgencyResult.success) {
                newCase.aiAnalysis = newCase.aiAnalysis || {};
                newCase.urgencyLevel = urgencyResult.data?.urgencyLevel || 'medium';
                newCase.aiAnalysis.urgencyScore = urgencyResult.data?.urgencyScore || 50;
                newCase.aiAnalysis.urgencyDetails = urgencyResult.data;
            }

            // Log AI interactions (don't await - fire and forget)
            Promise.all([
                deepseekService.logInteraction(clientId, 'classification', description, classificationResult, newCase._id),
                deepseekService.logInteraction(clientId, 'urgency', description, urgencyResult, newCase._id)
            ]).catch(err => console.error('AI logging error:', err));

        } catch (aiError) {
            console.warn('AI analysis failed, continuing without AI analysis:', aiError.message);
            // Set default values if AI fails
            newCase.aiAnalysis = {
                note: 'AI analysis pending - service temporarily unavailable'
            };
            newCase.urgencyLevel = 'medium';
        }

        console.log('Saving case...');
        await newCase.save();
        console.log('Case saved successfully:', newCase._id);

        // Log activity (wrap in try-catch to prevent failures)
        try {
            await ActivityLog.create({
                userId: clientId,
                action: 'case_create',
                entityType: 'case',
                entityId: newCase._id,
                details: { title, category }
            });
        } catch (logErr) {
            console.error('Activity log error:', logErr.message);
        }

        // Create notification (wrap in try-catch to prevent failures)
        try {
            await Notification.create({
                userId: clientId,
                type: 'case_submitted',
                title: 'Case Submitted Successfully',
                message: `Your case "${title}" has been submitted and is being analyzed.`,
                data: { caseId: newCase._id }
            });
        } catch (notifErr) {
            console.error('Notification error:', notifErr.message);
        }

        res.status(201).json({
            success: true,
            data: {
                case: newCase,
                aiAnalysis: newCase.aiAnalysis
            }
        });

    } catch (error) {
        console.error('Submit case error:', error.message, error.stack);
        res.status(500).json({ success: false, error: 'Failed to submit case', details: error.message });
    }
};



/**
 * Get advocate recommendations for a case
 */
export const getAdvocateRecommendations = async (req, res) => {
    try {
        const { caseId } = req.params;
        const clientId = req.user._id;

        // Get case
        const caseData = await Case.findOne({ _id: caseId, clientId });
        if (!caseData) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        // Get matching advocates
        const advocates = await Advocate.find({
            isVerified: true,
            isActive: true,
            isAvailable: true,
            'location.city': caseData.location?.city || { $exists: true },
            currentCaseLoad: { $lt: 15 } // Not overloaded
        })
            .populate('userId', 'name email phone')
            .limit(10);

        if (advocates.length === 0) {
            return res.json({
                success: true,
                data: {
                    recommendations: [],
                    message: 'No available advocates found matching your criteria'
                }
            });
        }

        // Run AI matching
        const matchResult = await deepseekService.matchAdvocates(caseData, advocates);

        // Log AI interaction
        await deepseekService.logInteraction(clientId, 'matching', { caseId }, matchResult, caseId);

        // Build recommendations
        let recommendations = [];

        if (matchResult.success && matchResult.data.rankings) {
            recommendations = matchResult.data.rankings.map(ranking => {
                const advocate = advocates[ranking.advocateIndex];
                return {
                    advocate: {
                        id: advocate._id,
                        name: advocate.userId?.name || advocate.barCouncilId,
                        specialization: advocate.specialization,
                        experienceYears: advocate.experienceYears,
                        rating: advocate.rating,
                        successRate: advocate.successRate,
                        location: advocate.location,
                        feeRange: advocate.feeRange
                    },
                    matchScore: ranking.matchScore,
                    matchReasons: ranking.matchReasons,
                    concerns: ranking.concerns
                };
            });
        } else {
            // Fallback: simple ranking by rating and experience
            recommendations = advocates.map(advocate => ({
                advocate: {
                    id: advocate._id,
                    name: advocate.userId?.name || advocate.barCouncilId,
                    specialization: advocate.specialization,
                    experienceYears: advocate.experienceYears,
                    rating: advocate.rating,
                    successRate: advocate.successRate,
                    location: advocate.location,
                    feeRange: advocate.feeRange
                },
                matchScore: Math.round((advocate.rating * 10 + advocate.successRate) / 2),
                matchReasons: ['Available in your area', 'Verified advocate'],
                concerns: []
            })).sort((a, b) => b.matchScore - a.matchScore);
        }

        res.json({
            success: true,
            data: {
                case: {
                    id: caseData._id,
                    title: caseData.title,
                    category: caseData.category
                },
                recommendations: recommendations.slice(0, 5),
                totalAvailable: advocates.length
            }
        });

    } catch (error) {
        console.error('Get advocate recommendations error:', error);
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

        // Validate case ownership
        const caseData = await Case.findOne({ _id: caseId, clientId });
        if (!caseData) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        if (caseData.advocateId) {
            return res.status(400).json({ success: false, error: 'Case already has an assigned advocate' });
        }

        // Validate advocate
        const advocate = await Advocate.findById(advocateId);
        if (!advocate || !advocate.isVerified || !advocate.isAvailable) {
            return res.status(400).json({ success: false, error: 'Advocate not available' });
        }

        // Update case
        caseData.advocateId = advocateId;
        caseData.status = 'pending_acceptance';
        await caseData.save();

        // Notify advocate
        await Notification.create({
            userId: advocate.userId,
            type: 'case_request',
            title: 'New Case Request',
            message: `You have a new case request: "${caseData.title}"`,
            data: { caseId: caseData._id }
        });

        // Log activity
        await ActivityLog.create({
            userId: clientId,
            action: 'advocate_hire',
            entityType: 'case',
            entityId: caseId,
            details: { advocateId }
        });

        res.json({
            success: true,
            message: 'Hire request sent to advocate',
            data: { case: caseData }
        });

    } catch (error) {
        console.error('Hire advocate error:', error);
        res.status(500).json({ success: false, error: 'Failed to hire advocate' });
    }
};
