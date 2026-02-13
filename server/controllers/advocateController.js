import Case from '../models/Case.js';
import Advocate from '../models/Advocate.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import Review from '../models/Review.js';

/**
 * Get advocate dashboard data
 */
export const getAdvocateDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get advocate profile
        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        // Get case statistics
        const [activeCases, pendingRequests, completedCases, totalCases] = await Promise.all([
            Case.countDocuments({ advocateId: advocate._id, status: { $in: ['assigned', 'in_review', 'in_progress'] } }),
            Case.countDocuments({ advocateId: advocate._id, status: 'pending_acceptance' }),
            Case.countDocuments({ advocateId: advocate._id, status: { $in: ['completed', 'closed'] } }),
            Case.countDocuments({ advocateId: advocate._id })
        ]);

        // Get urgent cases count
        const urgentCases = await Case.countDocuments({
            advocateId: advocate._id,
            status: { $in: ['assigned', 'in_review', 'in_progress'] },
            urgencyLevel: { $in: ['critical', 'high'] }
        });

        // Get recent cases sorted by urgency
        const recentCases = await Case.find({
            advocateId: advocate._id,
            status: { $nin: ['closed', 'cancelled'] }
        })
            .sort({
                urgencyLevel: -1,
                'aiAnalysis.urgencyScore': -1,
                updatedAt: -1
            })
            .limit(5)
            .populate('clientId', 'name email')
            .select('title category status urgencyLevel aiAnalysis.urgencyScore updatedAt');

        // Get pending requests
        const requests = await Case.find({
            advocateId: advocate._id,
            status: 'pending_acceptance'
        })
            .sort({ 'aiAnalysis.urgencyScore': -1 })
            .limit(5)
            .populate('clientId', 'name')
            .select('title category urgencyLevel aiAnalysis createdAt');

        // Get unread notifications
        const unreadNotifications = await Notification.countDocuments({ userId, read: false });

        // Calculate earnings (if monetized)
        const earnings = {
            total: advocate.totalEarnings || 0,
            thisMonth: advocate.monthlyEarnings || 0,
            pending: advocate.pendingEarnings || 0
        };

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
                earnings,
                unreadNotifications
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

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const query = { advocateId: advocate._id };

        if (status) {
            query.status = status;
        }

        if (urgency) {
            query.urgencyLevel = urgency;
        }

        const cases = await Case.find(query)
            .sort({ urgencyLevel: -1, 'aiAnalysis.urgencyScore': -1, updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('clientId', 'name email phone')
            .select('-aiAnalysis.embedding');

        const totalCases = await Case.countDocuments(query);

        res.json({
            success: true,
            data: {
                cases,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCases / limit),
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

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const requests = await Case.find({
            advocateId: advocate._id,
            status: 'pending_acceptance'
        })
            .sort({ 'aiAnalysis.urgencyScore': -1, createdAt: -1 })
            .populate('clientId', 'name email phone')
            .select('-aiAnalysis.embedding');

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

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const caseData = await Case.findOne({
            _id: caseId,
            advocateId: advocate._id,
            status: 'pending_acceptance'
        });

        if (!caseData) {
            return res.status(404).json({ success: false, error: 'Case request not found' });
        }

        if (action === 'accept') {
            caseData.status = 'assigned';
            caseData.assignedAt = new Date();

            // Increment advocate's case load
            advocate.currentCaseLoad = (advocate.currentCaseLoad || 0) + 1;
            await advocate.save();

            // Notify client
            await Notification.create({
                userId: caseData.clientId,
                type: 'advocate_accepted',
                title: 'Advocate Accepted Your Case',
                message: `${req.user.name} has accepted to handle your case "${caseData.title}"`,
                data: { caseId: caseData._id }
            });

        } else if (action === 'reject') {
            // Find next best advocate and auto-assign
            const nextAdvocate = await Advocate.findOne({
                _id: { $ne: advocate._id },
                isVerified: true,
                isActive: true,
                isAvailable: true,
                specialization: { $in: caseData.category ? [caseData.category] : [] },
                currentCaseLoad: { $lt: 15 }
            }).sort({ rating: -1, successRate: -1 });

            if (nextAdvocate) {
                caseData.advocateId = nextAdvocate._id;
                caseData.status = 'pending_acceptance';

                // Notify new advocate
                await Notification.create({
                    userId: nextAdvocate.userId,
                    type: 'case_request',
                    title: 'New Case Request',
                    message: `You have a new case request: "${caseData.title}"`,
                    data: { caseId: caseData._id }
                });
            } else {
                caseData.advocateId = null;
                caseData.status = 'submitted';
            }

            // Notify client about rejection
            await Notification.create({
                userId: caseData.clientId,
                type: 'advocate_rejected',
                title: 'Advocate Unavailable',
                message: `The advocate was unable to take your case. ${nextAdvocate ? 'We have forwarded your request to another qualified advocate.' : 'Please try finding another advocate.'}`,
                data: { caseId: caseData._id, reason }
            });
        }

        await caseData.save();

        // Log activity
        await ActivityLog.create({
            userId,
            action: action === 'accept' ? 'case_accept' : 'case_reject',
            entityType: 'case',
            entityId: caseId,
            details: { action, reason }
        });

        res.json({
            success: true,
            message: action === 'accept' ? 'Case accepted successfully' : 'Case rejected and reassigned',
            data: { case: caseData }
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

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        const caseData = await Case.findOne({
            _id: caseId,
            advocateId: advocate._id
        });

        if (!caseData) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        // Valid status transitions
        const validTransitions = {
            'assigned': ['in_review'],
            'in_review': ['in_progress', 'assigned'],
            'in_progress': ['completed'],
            'completed': ['closed']
        };

        if (!validTransitions[caseData.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot transition from ${caseData.status} to ${status}`
            });
        }

        const previousStatus = caseData.status;
        caseData.status = status;

        // Add timeline entry
        caseData.timeline = caseData.timeline || [];
        caseData.timeline.push({
            status,
            updatedBy: userId,
            notes,
            timestamp: new Date()
        });

        // Handle completion
        if (status === 'completed') {
            caseData.completedAt = new Date();
            advocate.currentCaseLoad = Math.max(0, (advocate.currentCaseLoad || 1) - 1);
            advocate.totalCases = (advocate.totalCases || 0) + 1;
            await advocate.save();
        }

        await caseData.save();

        // Notify client
        await Notification.create({
            userId: caseData.clientId,
            type: 'case_update',
            title: 'Case Status Updated',
            message: `Your case "${caseData.title}" status changed to ${status}`,
            data: { caseId: caseData._id, previousStatus, newStatus: status }
        });

        res.json({
            success: true,
            data: { case: caseData }
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
        const { period = 'month' } = req.query;

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        // Calculate date range
        const now = new Date();
        let startDate;
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Get case stats
        const [totalHandled, completedInPeriod, avgResolutionTime, reviews] = await Promise.all([
            Case.countDocuments({ advocateId: advocate._id }),
            Case.countDocuments({
                advocateId: advocate._id,
                status: { $in: ['completed', 'closed'] },
                completedAt: { $gte: startDate }
            }),
            Case.aggregate([
                {
                    $match: {
                        advocateId: advocate._id,
                        completedAt: { $exists: true },
                        assignedAt: { $exists: true }
                    }
                },
                {
                    $project: {
                        resolutionTime: { $subtract: ['$completedAt', '$assignedAt'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgTime: { $avg: '$resolutionTime' }
                    }
                }
            ]),
            Review.find({ advocateId: advocate._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('clientId', 'name')
        ]);

        // Calculate success rate
        const successfulCases = await Case.countDocuments({
            advocateId: advocate._id,
            status: 'completed',
            'outcome.result': 'success'
        });

        const successRate = totalHandled > 0
            ? Math.round((successfulCases / totalHandled) * 100)
            : 0;

        // Calculate avg resolution in days
        const avgResolutionDays = avgResolutionTime[0]
            ? Math.round(avgResolutionTime[0].avgTime / (1000 * 60 * 60 * 24))
            : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalHandled,
                    successRate,
                    avgResolutionDays,
                    rating: advocate.rating,
                    totalReviews: advocate.totalReviews || 0
                },
                periodStats: {
                    period,
                    completedCases: completedInPeriod
                },
                categoryBreakdown: await Case.aggregate([
                    { $match: { advocateId: advocate._id } },
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
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

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        // Fields that can be updated
        const allowedUpdates = [
            'specialization', 'experienceYears', 'bio', 'languages',
            'education', 'awards', 'feeRange', 'isAvailable',
            'location', 'practicingCourts'
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                advocate[field] = updates[field];
            }
        });

        // Map isAvailable to isAcceptingCases
        if (updates.isAvailable !== undefined) {
            advocate.isAcceptingCases = updates.isAvailable;
            // If toggling availability OFF, update last active
            if (updates.isAvailable === false) {
                advocate.lastActiveAt = new Date();
            }
        }

        await advocate.save();

        res.json({
            success: true,
            data: { advocate }
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

        const advocate = await Advocate.findOne({ userId });
        if (!advocate) {
            return res.status(404).json({ success: false, error: 'Advocate profile not found' });
        }

        advocate.isAcceptingCases = isAcceptingCases !== undefined ? isAcceptingCases : !advocate.isAcceptingCases;
        await advocate.save();

        res.json({
            success: true,
            data: {
                isAcceptingCases: advocate.isAcceptingCases,
                isAvailable: advocate.isAcceptingCases
            }
        });

    } catch (error) {
        console.error('Toggle availability error:', error);
        res.status(500).json({ success: false, error: 'Failed to update availability' });
    }
};
