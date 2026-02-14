import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';

/**
 * Get advocate dashboard data
 */
export const getAdvocateDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get advocate profile
        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocate = { _id: advSnap.docs[0].id, ...advSnap.docs[0].data() };

        // Get cases assigned to this advocate
        const casesSnap = await db.collection('cases')
            .where('advocateId', '==', advocate._id)
            .get();
        const allCases = queryToArray(casesSnap);

        const activeCases = allCases.filter(c => ['assigned', 'in_review', 'in_progress', 'advocate_assigned'].includes(c.status)).length;
        const pendingRequests = allCases.filter(c => c.status === 'pending_acceptance').length;
        const completedCases = allCases.filter(c => ['completed', 'closed', 'resolved'].includes(c.status)).length;
        const urgentCases = allCases.filter(c =>
            ['assigned', 'in_review', 'in_progress'].includes(c.status) &&
            ['critical', 'high'].includes(c.urgencyLevel)
        ).length;
        const totalCases = allCases.length;

        // Recent active cases
        const recentCases = allCases
            .filter(c => !['closed', 'cancelled'].includes(c.status))
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
            .slice(0, 5);

        // Pending requests
        const requests = allCases
            .filter(c => c.status === 'pending_acceptance')
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            .slice(0, 5);

        // Unread notifications
        const notifSnap = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false)
            .get();

        res.json({
            success: true,
            data: {
                profile: {
                    name: req.user.name,
                    rating: advocate.rating,
                    totalCases: advocate.totalCases,
                    successRate: advocate.successRate,
                    isAvailable: advocate.isAcceptingCases
                },
                stats: {
                    activeCases,
                    pendingRequests,
                    completedCases,
                    urgentCases,
                    totalCases
                },
                recentCases,
                requests,
                earnings: {
                    total: advocate.totalEarnings || 0,
                    thisMonth: advocate.monthlyEarnings || 0,
                    pending: advocate.pendingEarnings || 0
                },
                unreadNotifications: notifSnap.size
            }
        });

    } catch (error) {
        console.error('Advocate dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
};

/**
 * Get assigned cases
 */
export const getAssignedCases = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status, urgency } = req.query;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocate = { _id: advSnap.docs[0].id };

        let query = db.collection('cases').where('advocateId', '==', advocate._id);
        const casesSnap = await query.get();
        let cases = queryToArray(casesSnap);

        if (status) cases = cases.filter(c => c.status === status);
        if (urgency) cases = cases.filter(c => c.urgencyLevel === urgency);

        cases.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        const totalCases = cases.length;

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        cases = cases.slice(startIndex, startIndex + parseInt(limit));

        // Enrich with client info
        for (let c of cases) {
            if (c.clientId) {
                const uDoc = await db.collection('users').doc(c.clientId).get();
                if (uDoc.exists) {
                    c.clientName = uDoc.data().name;
                    c.clientEmail = uDoc.data().email;
                }
            }
        }

        res.json({
            success: true,
            data: {
                cases,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCases / parseInt(limit)),
                    totalCases
                }
            }
        });

    } catch (error) {
        console.error('Get assigned cases error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cases' });
    }
};

/**
 * Get case requests
 */
export const getCaseRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocate = { _id: advSnap.docs[0].id };

        const casesSnap = await db.collection('cases')
            .where('advocateId', '==', advocate._id)
            .where('status', '==', 'pending_acceptance')
            .get();

        let requests = queryToArray(casesSnap);

        // Enrich with client info
        for (let r of requests) {
            if (r.clientId) {
                const uDoc = await db.collection('users').doc(r.clientId).get();
                if (uDoc.exists) {
                    r.clientName = uDoc.data().name;
                    r.clientEmail = uDoc.data().email;
                }
            }
        }

        res.json({
            success: true,
            data: { requests }
        });

    } catch (error) {
        console.error('Get case requests error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
};

/**
 * Respond to case request (accept/reject)
 */
export const respondToRequest = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { action, reason } = req.body;
        const userId = req.user._id;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocate = { _id: advSnap.docs[0].id, ...advSnap.docs[0].data() };

        const caseDoc = await db.collection('cases').doc(caseId).get();
        if (!caseDoc.exists || caseDoc.data().advocateId !== advocate._id || caseDoc.data().status !== 'pending_acceptance') {
            return res.status(404).json({ success: false, error: 'Case request not found' });
        }

        const caseData = caseDoc.data();

        if (action === 'accept') {
            await db.collection('cases').doc(caseId).update({
                status: 'assigned',
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Increment case load
            await db.collection('advocates').doc(advocate._id).update({
                currentCaseLoad: (advocate.currentCaseLoad || 0) + 1
            });

            // Notify client
            await db.collection('notifications').doc(generateId()).set({
                userId: caseData.clientId,
                type: 'advocate_accepted',
                title: 'Advocate Accepted Your Case',
                message: `${req.user.name} has accepted to handle your case "${caseData.title}"`,
                data: { caseId },
                isRead: false,
                createdAt: new Date().toISOString()
            });

        } else if (action === 'reject') {
            await db.collection('cases').doc(caseId).update({
                advocateId: null,
                status: 'submitted',
                updatedAt: new Date().toISOString()
            });

            await db.collection('notifications').doc(generateId()).set({
                userId: caseData.clientId,
                type: 'advocate_rejected',
                title: 'Advocate Unavailable',
                message: 'The advocate was unable to take your case. Please try finding another advocate.',
                data: { caseId, reason },
                isRead: false,
                createdAt: new Date().toISOString()
            });
        }

        // Log activity
        await db.collection('activityLogs').doc(generateId()).set({
            userId,
            action: action === 'accept' ? 'case_accept' : 'case_reject',
            entityType: 'case',
            entityId: caseId,
            details: { action, reason },
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: action === 'accept' ? 'Case accepted successfully' : 'Case rejected',
        });

    } catch (error) {
        console.error('Respond to request error:', error);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
};

/**
 * Update case status
 */
export const updateCaseStatus = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user._id;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocate = { _id: advSnap.docs[0].id, ...advSnap.docs[0].data() };

        const caseDoc = await db.collection('cases').doc(caseId).get();
        if (!caseDoc.exists || caseDoc.data().advocateId !== advocate._id) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseDoc.data();
        const previousStatus = caseData.status;

        const timeline = caseData.timeline || [];
        timeline.push({
            status,
            updatedBy: userId,
            notes,
            timestamp: new Date().toISOString()
        });

        const updateData = {
            status,
            timeline,
            updatedAt: new Date().toISOString()
        };

        if (status === 'completed') {
            updateData.completedAt = new Date().toISOString();
            await db.collection('advocates').doc(advocate._id).update({
                currentCaseLoad: Math.max(0, (advocate.currentCaseLoad || 1) - 1),
                totalCases: (advocate.totalCases || 0) + 1
            });
        }

        await db.collection('cases').doc(caseId).update(updateData);

        // Notify client
        await db.collection('notifications').doc(generateId()).set({
            userId: caseData.clientId,
            type: 'case_update',
            title: 'Case Status Updated',
            message: `Your case "${caseData.title}" status changed to ${status}`,
            data: { caseId, previousStatus, newStatus: status },
            isRead: false,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            data: { case: { _id: caseId, ...caseData, ...updateData } }
        });

    } catch (error) {
        console.error('Update case status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
};

/**
 * Get advocate analytics
 */
export const getAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocate = { _id: advSnap.docs[0].id, ...advSnap.docs[0].data() };

        const casesSnap = await db.collection('cases')
            .where('advocateId', '==', advocate._id)
            .get();
        const allCases = queryToArray(casesSnap);

        const totalHandled = allCases.length;
        const completedCases = allCases.filter(c => ['completed', 'closed', 'resolved'].includes(c.status));
        const successRate = totalHandled > 0 ? Math.round((completedCases.length / totalHandled) * 100) : 0;

        // Category breakdown
        const categoryMap = {};
        allCases.forEach(c => {
            categoryMap[c.category || 'Other'] = (categoryMap[c.category || 'Other'] || 0) + 1;
        });
        const categoryBreakdown = Object.entries(categoryMap).map(([_id, count]) => ({ _id, count })).sort((a, b) => b.count - a.count);

        // Recent reviews
        const reviewsSnap = await db.collection('reviews')
            .where('advocateId', '==', advocate._id)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        const reviews = queryToArray(reviewsSnap);

        res.json({
            success: true,
            data: {
                overview: {
                    totalHandled,
                    successRate,
                    avgResolutionDays: 14, // placeholder
                    rating: advocate.rating,
                    totalReviews: advocate.totalReviews || 0
                },
                periodStats: {
                    period: 'month',
                    completedCases: completedCases.length
                },
                categoryBreakdown,
                recentReviews: reviews
            }
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
};

/**
 * Update advocate profile
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocateId = advSnap.docs[0].id;
        const allowedUpdates = [
            'specialization', 'experienceYears', 'bio', 'languages',
            'education', 'awards', 'feeRange', 'isAvailable',
            'location', 'practicingCourts'
        ];

        const updateData = { updatedAt: new Date().toISOString() };
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });

        if (updates.isAvailable !== undefined) {
            updateData.isAcceptingCases = updates.isAvailable;
        }

        await db.collection('advocates').doc(advocateId).update(updateData);

        const updatedDoc = await db.collection('advocates').doc(advocateId).get();

        res.json({
            success: true,
            data: { advocate: { _id: advocateId, ...updatedDoc.data() } }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
};

/**
 * Toggle advocate availability
 */
export const toggleAvailability = async (req, res) => {
    try {
        const userId = req.user._id;
        const { isAcceptingCases } = req.body;

        const advSnap = await db.collection('advocates')
            .where('userId', '==', userId)
            .limit(1).get();

        if (advSnap.empty) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocateId = advSnap.docs[0].id;
        const current = advSnap.docs[0].data();
        const newVal = isAcceptingCases !== undefined ? isAcceptingCases : !current.isAcceptingCases;

        await db.collection('advocates').doc(advocateId).update({
            isAcceptingCases: newVal,
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            data: { isAcceptingCases: newVal, isAvailable: newVal }
        });

    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({ success: false, error: 'Failed to update availability' });
    }
};
