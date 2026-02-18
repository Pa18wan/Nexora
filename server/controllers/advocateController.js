import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';

/**
 * Get advocate dashboard data
 */
export const getAdvocateDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get advocate profile
        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocates = queryToArray(advSnap);
        const advocate = advocates[0];

        // Get cases assigned to this advocate
        const casesSnap = await db.ref('cases')
            .orderByChild('advocateId')
            .equalTo(advocate._id)
            .once('value');
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
        const notifSnap = await db.ref('notifications')
            .orderByChild('userId')
            .equalTo(userId)
            .once('value');

        let notifications = queryToArray(notifSnap);
        const unreadCount = notifications.filter(n => n.isRead === false).length;

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
                unreadNotifications: unreadCount
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocate = advocatesArr[0];

        const casesSnap = await db.ref('cases')
            .orderByChild('advocateId')
            .equalTo(advocate._id)
            .once('value');
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
                const uSnapshot = await db.ref('users/' + c.clientId).once('value');
                if (uSnapshot.exists()) {
                    c.clientName = uSnapshot.val().name;
                    c.clientEmail = uSnapshot.val().email;
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocate = advocatesArr[0];

        const casesSnap = await db.ref('cases')
            .orderByChild('advocateId')
            .equalTo(advocate._id)
            .once('value');

        let allRequests = queryToArray(casesSnap);
        let requests = allRequests.filter(c => c.status === 'pending_acceptance');

        // Enrich with client info
        for (let r of requests) {
            if (r.clientId) {
                const uSnapshot = await db.ref('users/' + r.clientId).once('value');
                if (uSnapshot.exists()) {
                    r.clientName = uSnapshot.val().name;
                    r.clientEmail = uSnapshot.val().email;
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocate = advocatesArr[0];

        const caseSnapshot = await db.ref('cases/' + caseId).once('value');
        if (!caseSnapshot.exists() || caseSnapshot.val().advocateId !== advocate._id || caseSnapshot.val().status !== 'pending_acceptance') {
            return res.status(404).json({ success: false, error: 'Case request not found' });
        }

        const caseData = { _id: caseSnapshot.key, ...caseSnapshot.val() };

        if (action === 'accept') {
            await db.ref('cases/' + caseId).update({
                status: 'assigned',
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Increment case load
            await db.ref('advocates/' + advocate._id).update({
                currentCaseLoad: (advocate.currentCaseLoad || 0) + 1
            });

            // Notify client
            await db.ref('notifications').push({
                userId: caseData.clientId,
                type: 'advocate_accepted',
                title: 'Advocate Accepted Your Case',
                message: `${req.user.name} has accepted to handle your case "${caseData.title}"`,
                data: { caseId },
                isRead: false,
                createdAt: new Date().toISOString()
            });

        } else if (action === 'reject') {
            await db.ref('cases/' + caseId).update({
                advocateId: null,
                status: 'submitted',
                updatedAt: new Date().toISOString()
            });

            await db.ref('notifications').push({
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
        await db.ref('activityLogs').push({
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocate = advocatesArr[0];

        const caseSnapshot = await db.ref('cases/' + caseId).once('value');
        if (!caseSnapshot.exists() || caseSnapshot.val().advocateId !== advocate._id) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseSnapshot.val();
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
            await db.ref('advocates/' + advocate._id).update({
                currentCaseLoad: Math.max(0, (advocate.currentCaseLoad || 1) - 1),
                totalCases: (advocate.totalCases || 0) + 1
            });
        }

        await db.ref('cases/' + caseId).update(updateData);

        // Notify client
        await db.ref('notifications').push({
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocate = advocatesArr[0];

        const casesSnap = await db.ref('cases')
            .orderByChild('advocateId')
            .equalTo(advocate._id)
            .once('value');
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
        const reviewsSnap = await db.ref('reviews')
            .orderByChild('advocateId')
            .equalTo(advocate._id)
            .once('value');
        let reviews = queryToArray(reviewsSnap);
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        reviews = reviews.slice(0, 10);

        // Monthly case data for charts
        const now = new Date();
        const monthLabels = [];
        const monthlyEarningsData = [];
        const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const weekData = [0, 0, 0, 0];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthLabels.push(d.toLocaleString('default', { month: 'short' }));
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const monthCases = allCases.filter(c => {
                const cd = new Date(c.createdAt);
                return cd >= d && cd < nextMonth;
            });
            monthlyEarningsData.push(monthCases.length * 5000); // estimated earnings
        }

        // Client acquisition per week (last 4 weeks)
        for (let w = 3; w >= 0; w--) {
            const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
            weekData[3 - w] = allCases.filter(c => {
                const cd = new Date(c.createdAt);
                return cd >= weekStart && cd < weekEnd;
            }).length;
        }

        // Cases by category for doughnut chart
        const catLabels = categoryBreakdown.slice(0, 5).map(c => c._id);
        const catData = categoryBreakdown.slice(0, 5).map(c => c.count);

        // Workload distribution
        const activeCases = allCases.filter(c => c.status === 'active' || c.status === 'in_progress').length;
        const pendingCases = allCases.filter(c => c.status === 'pending').length;

        res.json({
            success: true,
            data: {
                stats: {
                    avgRating: advocate.rating || 4.5,
                    successRate,
                    matchRelevancy: Math.min(95, 60 + totalHandled * 2),
                    monthlyRevenue: monthlyEarningsData[monthlyEarningsData.length - 1] || 0,
                    ratingTrend: 0.2,
                    revenueTrend: 12
                },
                clientAcquisition: {
                    labels: weekLabels,
                    data: weekData
                },
                casesByCategory: {
                    labels: catLabels.length > 0 ? catLabels : ['No Data'],
                    data: catData.length > 0 ? catData : [1]
                },
                monthlyEarnings: {
                    labels: monthLabels,
                    data: monthlyEarningsData
                },
                workloadDistribution: [
                    { name: 'Active Cases', count: activeCases, color: '#3b82f6' },
                    { name: 'Pending', count: pendingCases, color: '#8b5cf6' },
                    { name: 'Completed', count: completedCases.length, color: '#10b981' },
                    { name: 'Reviews', count: reviews.length, color: '#06b6d4' }
                ],
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocateId = advocatesArr[0]._id;
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

        await db.ref('advocates/' + advocateId).update(updateData);

        const updatedSnapshot = await db.ref('advocates/' + advocateId).once('value');

        res.json({
            success: true,
            data: { advocate: { _id: advocateId, ...updatedSnapshot.val() } }
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

        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const advocatesArr = queryToArray(advSnap);
        const advocateId = advocatesArr[0]._id;
        const current = advocatesArr[0];
        const newVal = isAcceptingCases !== undefined ? isAcceptingCases : !current.isAcceptingCases;

        await db.ref('advocates/' + advocateId).update({
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
