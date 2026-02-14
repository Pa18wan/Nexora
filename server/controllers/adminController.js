import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboard = async (req, res) => {
    try {
        // Count clients
        const clientsSnap = await db.collection('users').where('role', '==', 'client').get();
        const totalUsers = clientsSnap.size;

        // Count active advocates
        const activeAdvSnap = await db.collection('advocates')
            .where('isVerified', '==', true)
            .where('isActive', '==', true)
            .get();
        const activeAdvocates = activeAdvSnap.size;

        // Count cases
        const casesSnap = await db.collection('cases').get();
        const allCases = queryToArray(casesSnap);
        const totalCases = allCases.length;
        const urgentCases = allCases.filter(c => ['critical', 'high'].includes(c.urgencyLevel)).length;

        // Pending verifications
        const pendingSnap = await db.collection('advocates')
            .where('isVerified', '==', false)
            .get();
        const pendingVerifications = pendingSnap.size;

        // Recent activity
        const activitySnap = await db.collection('activityLogs')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        const recentActivity = queryToArray(activitySnap);

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

        let query = db.collection('users');
        if (role) {
            query = query.where('role', '==', role);
        }

        const usersSnap = await query.get();
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

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
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
        await db.collection('users').doc(userId).update(update);

        // Log admin action
        await db.collection('adminLogs').doc(generateId()).set({
            adminId,
            action: `user_${action}`,
            targetType: 'user',
            targetId: userId,
            reason,
            createdAt: new Date().toISOString()
        });

        const updatedDoc = await db.collection('users').doc(userId).get();
        const { password, ...updatedUser } = updatedDoc.data();

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
        const advSnap = await db.collection('advocates')
            .where('isVerified', '==', false)
            .get();

        let advocates = queryToArray(advSnap);

        // Enrich with user data
        for (let adv of advocates) {
            if (adv.userId) {
                const uDoc = await db.collection('users').doc(adv.userId).get();
                if (uDoc.exists) {
                    const { password, ...userData } = uDoc.data();
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
 * Verify Advocate
 */
export const verifyAdvocate = async (req, res) => {
    try {
        const { advocateId } = req.params;
        const { action, reason } = req.body;
        const adminId = req.user._id;

        const advDoc = await db.collection('advocates').doc(advocateId).get();
        if (!advDoc.exists) {
            return res.status(404).json({ success: false, error: 'Advocate not found' });
        }

        if (action === 'approve') {
            await db.collection('advocates').doc(advocateId).update({
                isVerified: true,
                updatedAt: new Date().toISOString()
            });
        }

        await db.collection('adminLogs').doc(generateId()).set({
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
        const settingsSnap = await db.collection('systemSettings').get();
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
            const snap = await db.collection('systemSettings')
                .where('key', '==', update.key)
                .limit(1).get();

            if (snap.empty) {
                await db.collection('systemSettings').doc(generateId()).set({
                    key: update.key,
                    value: update.value,
                    lastUpdatedBy: adminId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                await db.collection('systemSettings').doc(snap.docs[0].id).update({
                    value: update.value,
                    lastUpdatedBy: adminId,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        await db.collection('adminLogs').doc(generateId()).set({
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

        const complaintsSnap = await db.collection('complaints')
            .orderBy('createdAt', 'desc')
            .get();

        let complaints = queryToArray(complaintsSnap);

        if (status) complaints = complaints.filter(c => c.status === status);
        if (type) complaints = complaints.filter(c => c.type === type);

        const total = complaints.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        complaints = complaints.slice(startIndex, startIndex + parseInt(limit));

        // Enrich with user info
        for (let c of complaints) {
            if (c.raisedBy) {
                const uDoc = await db.collection('users').doc(c.raisedBy).get();
                if (uDoc.exists) {
                    const { password, ...userData } = uDoc.data();
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

        const complaintDoc = await db.collection('complaints').doc(complaintId).get();
        if (!complaintDoc.exists) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        await db.collection('complaints').doc(complaintId).update({
            status: action,
            resolutionNotes: notes,
            resolvedBy: adminId,
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await db.collection('adminLogs').doc(generateId()).set({
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
