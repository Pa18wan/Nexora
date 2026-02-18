import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboard = async (req, res) => {
    try {
        // Count clients
        const clientsSnap = await db.ref('users')
            .orderByChild('role')
            .equalTo('client')
            .once('value');
        const totalUsers = clientsSnap.numChildren();

        // Count active advocates
        const advSnap = await db.ref('advocates').once('value');
        const advocates = queryToArray(advSnap);
        const activeAdvocates = advocates.filter(a => a.isVerified === true && a.isActive === true).length;

        // Count cases
        const casesSnap = await db.ref('cases').once('value');
        const allCases = queryToArray(casesSnap);
        const totalCases = allCases.length;
        const urgentCases = allCases.filter(c => ['critical', 'high'].includes(c.urgencyLevel)).length;

        // Pending verifications
        const pendingVerifications = advocates.filter(a => a.isVerified === false).length;

        // Recent activity
        const activitySnap = await db.ref('activityLogs')
            .orderByChild('createdAt')
            .limitToLast(10)
            .once('value');

        let recentActivity = queryToArray(activitySnap);
        recentActivity.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeAdvocates,
                    totalCases,
                    urgentCases,
                    pendingVerifications
                },
                recentActivity,
                aiStats: []
            }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to load dashboard' });
    }
};

/**
 * Get all users with filtering
 */
export const getUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 10 } = req.query;

        let usersSnap;
        if (role) {
            usersSnap = await db.ref('users')
                .orderByChild('role')
                .equalTo(role)
                .once('value');
        } else {
            usersSnap = await db.ref('users').once('value');
        }

        let users = queryToArray(usersSnap);

        // Filter by status
        if (status) {
            const isVerified = status === 'verified';
            users = users.filter(u => u.isVerified === isVerified);
        }

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(u =>
                (u.name && u.name.toLowerCase().includes(searchLower)) ||
                (u.email && u.email.toLowerCase().includes(searchLower))
            );
        }

        // Remove passwords
        users = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        // Sort by createdAt desc
        users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        const total = users.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        users = users.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

/**
 * Suspend/Block User
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action, reason } = req.body;
        const adminId = req.user._id;

        const userSnapshot = await db.ref('users/' + userId).once('value');
        if (!userSnapshot.exists()) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let update = {};
        if (action === 'suspend') {
            update = { isVerified: false };
        } else if (action === 'block') {
            update = { isActive: false };
        } else if (action === 'activate') {
            update = { isVerified: true, isActive: true };
        }

        update.updatedAt = new Date().toISOString();
        await db.ref('users/' + userId).update(update);

        // Log admin action
        await db.ref('adminLogs').push({
            adminId,
            action: `user_${action}`,
            targetType: 'user',
            targetId: userId,
            reason,
            createdAt: new Date().toISOString()
        });

        const updatedSnapshot = await db.ref('users/' + userId).once('value');
        const { password, ...updatedUser } = updatedSnapshot.val();

        res.json({
            success: true,
            message: `User ${action}ed successfully`,
            data: { user: { _id: userId, ...updatedUser } }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
};

/**
 * Get Pending Advocate Verifications
 */
export const getPendingAdvocates = async (req, res) => {
    try {
        const advSnap = await db.ref('advocates')
            .orderByChild('isVerified')
            .equalTo(false)
            .once('value');

        let advocates = queryToArray(advSnap);

        // Enrich with user data
        for (let adv of advocates) {
            if (adv.userId) {
                const uSnapshot = await db.ref('users/' + adv.userId).once('value');
                if (uSnapshot.exists()) {
                    const { password, ...userData } = uSnapshot.val();
                    adv.user = { _id: adv.userId, ...userData };
                }
            }
        }

        res.json({
            success: true,
            data: { advocates }
        });

    } catch (error) {
        console.error('Get pending advocates error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pending advocates' });
    }
};

/**
 * Get All Advocates (Admin)
 */
export const getAllAdvocates = async (req, res) => {
    try {
        const { isVerified } = req.query;

        let advSnap;
        if (isVerified !== undefined) {
            advSnap = await db.ref('advocates')
                .orderByChild('isVerified')
                .equalTo(isVerified === 'true')
                .once('value');
        } else {
            advSnap = await db.ref('advocates').once('value');
        }

        let advocates = queryToArray(advSnap);

        // Enrich with user data
        for (let adv of advocates) {
            if (adv.userId) {
                const uSnapshot = await db.ref('users/' + adv.userId).once('value');
                if (uSnapshot.exists()) {
                    const { password, ...userData } = uSnapshot.val();
                    adv.userId = { _id: adv.userId, ...userData };
                }
            }
        }

        res.json({
            success: true,
            data: { advocates }
        });

    } catch (error) {
        console.error('Get all advocates error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch advocates' });
    }
};

/**
 * Verify Advocate
 */
export const verifyAdvocate = async (req, res) => {
    try {
        const { advocateId } = req.params;
        const { action, reason } = req.body;
        const adminId = req.user._id;

        const advSnapshot = await db.ref('advocates/' + advocateId).once('value');
        if (!advSnapshot.exists()) {
            return res.status(404).json({ success: false, error: 'Advocate not found' });
        }

        if (action === 'approve') {
            await db.ref('advocates/' + advocateId).update({
                isVerified: true,
                updatedAt: new Date().toISOString()
            });
        }

        await db.ref('adminLogs').push({
            adminId,
            action: action === 'approve' ? 'advocate_approve' : 'advocate_reject',
            targetType: 'advocate',
            targetId: advocateId,
            reason: reason || '',
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `Advocate ${action}d successfully`
        });

    } catch (error) {
        console.error('Verify advocate error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify advocate' });
    }
};

/**
 * Get System Settings
 */
export const getSystemSettings = async (req, res) => {
    try {
        const settingsSnap = await db.ref('systemSettings').once('value');
        const settings = queryToArray(settingsSnap);

        res.json({ success: true, data: { settings } });
    } catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

/**
 * Update System Settings
 */
export const updateSystemSettings = async (req, res) => {
    try {
        const { updates } = req.body;
        const adminId = req.user._id;

        for (const update of updates) {
            // Find by key
            const snap = await db.ref('systemSettings')
                .orderByChild('key')
                .equalTo(update.key)
                .limitToFirst(1)
                .once('value');

            if (!snap.exists()) {
                await db.ref('systemSettings').push({
                    key: update.key,
                    value: update.value,
                    lastUpdatedBy: adminId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                const settingId = Object.keys(snap.val())[0];
                await db.ref('systemSettings/' + settingId).update({
                    value: update.value,
                    lastUpdatedBy: adminId,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Admin logs push
        await db.ref('adminLogs').push({
            adminId,
            action: 'settings_update',
            targetType: 'settings',
            targetId: adminId,
            createdAt: new Date().toISOString()
        });

        res.json({ success: true, message: 'Settings updated successfully' });

    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};

/**
 * Get All Complaints
 */
export const getComplaints = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;

        const complaintsSnap = await db.ref('complaints')
            .orderByChild('createdAt')
            .once('value');

        let complaints = queryToArray(complaintsSnap);

        if (status) complaints = complaints.filter(c => c.status === status);
        if (type) complaints = complaints.filter(c => c.type === type);

        const total = complaints.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        complaints = complaints.slice(startIndex, startIndex + parseInt(limit));

        // Enrich with user info
        for (let c of complaints) {
            if (c.raisedBy) {
                const uSnapshot = await db.ref('users/' + c.raisedBy).once('value');
                if (uSnapshot.exists()) {
                    const { password, ...userData } = uSnapshot.val();
                    c.raisedByUser = { _id: c.raisedBy, ...userData };
                }
            }
        }

        res.json({
            success: true,
            data: {
                complaints,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
    }
};

/**
 * Resolve Complaint
 */
export const resolveComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { action, notes } = req.body;
        const adminId = req.user._id;

        const complaintSnapshot = await db.ref('complaints/' + complaintId).once('value');
        if (!complaintSnapshot.exists()) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        await db.ref('complaints/' + complaintId).update({
            status: action,
            resolutionNotes: notes,
            resolvedBy: adminId,
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await db.ref('adminLogs').push({
            adminId,
            action: `complaint_${action}`,
            targetType: 'complaint',
            targetId: complaintId,
            reason: notes,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: `Complaint ${action} successfully`
        });

    } catch (error) {
        console.error('Resolve complaint error:', error);
        res.status(500).json({ success: false, error: 'Failed to resolve complaint' });
    }
};

/**
 * Get platform analytics
 */
export const getAnalytics = async (req, res) => {
    try {
        // Get all collections data
        const [usersSnap, advocatesSnap, casesSnap, aiLogsSnap, complaintsSnap, reviewsSnap, docsSnap, notifsSnap] = await Promise.all([
            db.ref('users').once('value'),
            db.ref('advocates').once('value'),
            db.ref('cases').once('value'),
            db.ref('aiLogs').once('value'),
            db.ref('complaints').once('value'),
            db.ref('reviews').once('value'),
            db.ref('documents').once('value'),
            db.ref('notifications').once('value')
        ]);

        const users = queryToArray(usersSnap);
        const advocates = queryToArray(advocatesSnap);
        const cases = queryToArray(casesSnap);
        const aiLogs = queryToArray(aiLogsSnap);
        const complaints = queryToArray(complaintsSnap);
        const reviews = queryToArray(reviewsSnap);

        // User breakdown
        const clients = users.filter(u => u.role === 'client');
        const advocateUsers = users.filter(u => u.role === 'advocate');
        const admins = users.filter(u => u.role === 'admin');
        const activeUsers = users.filter(u => u.isActive);
        const verifiedUsers = users.filter(u => u.isVerified);

        // Case category distribution
        const categoryMap = {};
        cases.forEach(c => {
            const cat = c.category || 'Uncategorized';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const caseCategories = Object.entries(categoryMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Case status distribution
        const statusMap = {};
        cases.forEach(c => {
            const s = c.status || 'unknown';
            statusMap[s] = (statusMap[s] || 0) + 1;
        });
        const caseStatuses = Object.entries(statusMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Urgency distribution
        const urgencyMap = {};
        cases.forEach(c => {
            const u = c.urgencyLevel || 'unknown';
            urgencyMap[u] = (urgencyMap[u] || 0) + 1;
        });
        const urgencyDistribution = Object.entries(urgencyMap)
            .map(([level, count]) => ({ level, count }));

        // Advocate stats
        const verifiedAdvocates = advocates.filter(a => a.isVerified);
        const pendingAdvocates = advocates.filter(a => !a.isVerified);
        const avgRating = verifiedAdvocates.length > 0
            ? (verifiedAdvocates.reduce((sum, a) => sum + (a.rating || 0), 0) / verifiedAdvocates.length).toFixed(1)
            : 0;
        const totalAdvocateCases = verifiedAdvocates.reduce((sum, a) => sum + (a.totalCases || 0), 0);

        // AI usage
        const chatLogs = aiLogs.filter(l => l.type === 'chat');
        const analysisLogs = aiLogs.filter(l => l.type === 'case_analysis');

        // Complaint stats
        const pendingComplaints = complaints.filter(c => c.status === 'pending');
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

        // Monthly user growth (approximate from createdAt)
        const monthlyGrowth = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const monthUsers = users.filter(u => {
                const d = new Date(u.createdAt);
                return d >= month && d < nextMonth;
            });
            monthlyGrowth.push({
                month: month.toLocaleString('default', { month: 'short', year: '2-digit' }),
                users: monthUsers.length,
                cases: cases.filter(c => {
                    const d = new Date(c.createdAt);
                    return d >= month && d < nextMonth;
                }).length
            });
        }

        // Top advocates by rating
        const topAdvocates = verifiedAdvocates
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5)
            .map(a => ({
                id: a._id,
                userId: a.userId,
                rating: a.rating,
                totalCases: a.totalCases,
                successRate: a.successRate,
                specialization: a.specialization
            }));

        // Enrich top advocates with user names
        for (const adv of topAdvocates) {
            if (adv.userId) {
                const uSnapshot = await db.ref('users/' + adv.userId).once('value');
                if (uSnapshot.exists()) {
                    adv.name = uSnapshot.val().name;
                }
            }
        }

        // Location distribution
        const locationMap = {};
        cases.forEach(c => {
            const loc = typeof c.location === 'string' ? c.location : c.location?.city || 'Unknown';
            locationMap[loc] = (locationMap[loc] || 0) + 1;
        });
        const locationDistribution = Object.entries(locationMap)
            .map(([city, count]) => ({ city, count }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers: users.length,
                    totalClients: clients.length,
                    totalAdvocates: advocateUsers.length,
                    totalAdmins: admins.length,
                    activeUsers: activeUsers.length,
                    verifiedUsers: verifiedUsers.length,
                    totalCases: cases.length,
                    totalDocuments: docsSnap.numChildren(),
                    totalNotifications: notifsSnap.numChildren(),
                    totalAIInteractions: aiLogs.length,
                    totalReviews: reviews.length
                },
                cases: {
                    categories: caseCategories,
                    statuses: caseStatuses,
                    urgencyDistribution
                },
                advocates: {
                    verified: verifiedAdvocates.length,
                    pending: pendingAdvocates.length,
                    avgRating: parseFloat(avgRating),
                    totalCasesHandled: totalAdvocateCases,
                    topAdvocates
                },
                ai: {
                    totalInteractions: aiLogs.length,
                    chatSessions: chatLogs.length,
                    caseAnalyses: analysisLogs.length
                },
                complaints: {
                    total: complaints.length,
                    pending: pendingComplaints.length,
                    resolved: resolvedComplaints.length,
                    inProgress: complaints.filter(c => c.status === 'in_progress').length
                },
                trends: {
                    monthlyGrowth,
                    locationDistribution
                }
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to load analytics' });
    }
};
