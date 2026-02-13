import User from '../models/User.js';
import Advocate from '../models/Advocate.js';
import Case from '../models/Case.js';
import Complaint from '../models/Complaint.js';
import AILog from '../models/AILog.js';
import AdminLog from '../models/AdminLog.js';
import SystemSettings from '../models/SystemSettings.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Get admin dashboard statistics
 */
export const getAdminDashboard = async (req, res) => {
    try {
        const [totalUsers, activeAdvocates, totalCases, urgentCases, pendingVerifications] = await Promise.all([
            User.countDocuments({ role: 'client' }),
            Advocate.countDocuments({ isVerified: true, isActive: true }),
            Case.countDocuments(),
            Case.countDocuments({ urgencyLevel: { $in: ['critical', 'high'] } }),
            Advocate.countDocuments({ isVerified: false })
        ]);

        const recentActivity = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name role');

        const aiStats = await AILog.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgTokens: { $avg: '$tokensUsed' }
                }
            }
        ]);

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
                aiStats
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
        const query = {};

        if (role) query.role = role;
        if (status) query.isVerified = status === 'verified';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-password');

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let update = {};
        if (action === 'suspend') {
            update = { isVerified: false }; // Temporary Example logic
        } else if (action === 'block') {
            update = { isBlocked: true }; // Assuming isBlocked field exists or adding it
        } else if (action === 'activate') {
            update = { isVerified: true, isBlocked: false };
        }

        const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });

        // Log admin action
        await AdminLog.create({
            adminId,
            action: `user_${action}`,
            targetType: 'user',
            targetId: userId,
            reason,
            previousState: { isVerified: user.isVerified }, // simplistic prev state
            newState: update
        });

        res.json({
            success: true,
            message: `User ${action}ed successfully`,
            data: { user: updatedUser }
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
        const advocates = await Advocate.find({ isVerified: false })
            .populate('userId', 'name email phone createdAt')
            .sort({ createdAt: 1 });

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
        const { action, reason } = req.body; // action: 'approve' or 'reject'
        const adminId = req.user._id;

        const advocate = await Advocate.findById(advocateId);
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate not found' });
        }

        if (action === 'approve') {
            advocate.isVerified = true;
            await advocate.save();

            // Log action
            await AdminLog.create({
                adminId,
                action: 'advocate_approve',
                targetType: 'advocate',
                targetId: advocateId
            });

        } else if (action === 'reject') {
            // Ideally notify user and maybe delete advocate profile or mark as rejected
            // For now, let's just log it. Real implementation might differ.
            await AdminLog.create({
                adminId,
                action: 'advocate_reject',
                targetType: 'advocate',
                targetId: advocateId,
                reason
            });
        }

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
        const settings = await SystemSettings.find();
        res.json({
            success: true,
            data: { settings }
        });
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
        const { updates } = req.body; // Array of { key, value }
        const adminId = req.user._id;

        for (const update of updates) {
            await SystemSettings.findOneAndUpdate(
                { key: update.key },
                {
                    value: update.value,
                    lastUpdatedBy: adminId
                },
                { upsert: true }
            );
        }

        await AdminLog.create({
            adminId,
            action: 'settings_update',
            targetType: 'settings',
            targetId: adminId, // Using admin ID as simple reference
            newState: updates
        });

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });

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
        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const complaints = await Complaint.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('raisedBy', 'name email role')
            .populate({
                path: 'againstAdvocate',
                populate: { path: 'userId', select: 'name email' }
            })
            .populate('caseId', 'title caseNumber');

        const total = await Complaint.countDocuments(query);

        res.json({
            success: true,
            data: {
                complaints,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
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
        const { action, notes } = req.body; // action: resolved, dismissed
        const adminId = req.user._id;

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, error: 'Complaint not found' });
        }

        complaint.status = action;
        complaint.resolutionNotes = notes;
        complaint.resolvedBy = adminId;
        complaint.resolvedAt = Date.now();
        await complaint.save();

        await AdminLog.create({
            adminId,
            action: `complaint_${action}`,
            targetType: 'complaint',
            targetId: complaintId,
            reason: notes
        });

        res.json({
            success: true,
            message: `Complaint ${action} successfully`,
            data: { complaint }
        });

    } catch (error) {
        console.error('Resolve complaint error:', error);
        res.status(500).json({ success: false, error: 'Failed to resolve complaint' });
    }
};
