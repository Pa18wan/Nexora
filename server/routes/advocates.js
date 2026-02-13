import express from 'express';
import Advocate from '../models/Advocate.js';
import User from '../models/User.js';
import Case from '../models/Case.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get specializations
router.get('/specializations', (req, res) => {
    const specializations = [
        'Criminal Law', 'Civil Law', 'Family Law', 'Property Law', 'Corporate Law',
        'Tax Law', 'Labor Law', 'Intellectual Property', 'Constitutional Law',
        'Consumer Law', 'Cyber Law', 'Immigration Law', 'Environmental Law',
        'Human Rights', 'Banking Law', 'Insurance Law', 'Medical Law',
        'Entertainment Law', 'Sports Law', 'General Practice'
    ];
    res.json({ success: true, data: specializations });
});

// Search advocates
router.get('/', async (req, res) => {
    try {
        const { specialization, city, minExperience, minRating, search, sortBy = 'rating', page = 1, limit = 10 } = req.query;

        const query = { verificationStatus: 'verified', isAcceptingCases: true };

        if (specialization) query.specialization = { $in: specialization.split(',') };
        if (city) query['officeAddress.city'] = new RegExp(city, 'i');
        if (minExperience) query.experienceYears = { $gte: parseInt(minExperience) };
        if (minRating) query.rating = { $gte: parseFloat(minRating) };

        let advocates = await Advocate.find(query)
            .populate('userId', 'name email avatar')
            .sort(sortBy === 'experience' ? { experienceYears: -1 } : { rating: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        if (search) {
            const userIds = await User.find({ name: new RegExp(search, 'i'), role: 'advocate' }).select('_id');
            advocates = advocates.filter(adv => userIds.some(u => u._id.toString() === adv.userId._id.toString()));
        }

        const total = await Advocate.countDocuments(query);

        res.json({
            success: true,
            data: { advocates, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
        });
    } catch (error) {
        console.error('Get advocates error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch advocates' });
    }
});

// Get advocate by ID
router.get('/:id', async (req, res) => {
    try {
        const advocate = await Advocate.findById(req.params.id).populate('userId', 'name email avatar phone');

        if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

        const totalAssignedCases = await Case.countDocuments({ advocateId: advocate._id });
        const resolvedCases = await Case.countDocuments({ advocateId: advocate._id, status: 'resolved' });

        res.json({
            success: true,
            data: {
                ...advocate.toObject(),
                statistics: {
                    totalCases: totalAssignedCases,
                    resolvedCases,
                    successRate: totalAssignedCases > 0 ? Math.round((resolvedCases / totalAssignedCases) * 100) : 0
                }
            }
        });
    } catch (error) {
        console.error('Get advocate error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch advocate' });
    }
});

// Update advocate profile
router.put('/profile', protect, authorize('advocate'), async (req, res) => {
    try {
        const advocate = await Advocate.findOne({ userId: req.user._id });
        if (!advocate) return res.status(404).json({ success: false, message: 'Advocate profile not found' });

        const updateFields = ['specialization', 'experienceYears', 'education', 'certifications',
            'courtsPracticed', 'languages', 'consultationFee', 'availability', 'officeAddress', 'bio', 'isAcceptingCases'];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) advocate[field] = req.body[field];
        });

        advocate.isProfileComplete = !!(advocate.specialization.length > 0 && advocate.experienceYears &&
            advocate.barCouncilId && advocate.officeAddress?.city);

        await advocate.save();

        res.json({ success: true, message: 'Profile updated successfully', data: advocate });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// Advocate dashboard stats
router.get('/dashboard/stats', protect, authorize('advocate'), async (req, res) => {
    try {
        const advocate = await Advocate.findOne({ userId: req.user._id });
        if (!advocate) return res.status(404).json({ success: false, message: 'Advocate profile not found' });

        const activeCases = await Case.countDocuments({ advocateId: advocate._id, status: { $in: ['advocate_assigned', 'in_progress'] } });
        const urgentCases = await Case.countDocuments({ advocateId: advocate._id, status: { $in: ['advocate_assigned', 'in_progress'] }, 'aiAnalysis.urgencyLevel': { $in: ['high', 'critical'] } });
        const pendingRequests = await Case.countDocuments({ 'recommendedAdvocates.advocateId': advocate._id, status: 'pending_advocate' });
        const resolvedCases = await Case.countDocuments({ advocateId: advocate._id, status: 'resolved' });
        const totalCases = await Case.countDocuments({ advocateId: advocate._id });

        res.json({
            success: true,
            data: {
                activeCases, urgentCases, pendingRequests, resolvedCases, totalCases,
                successRate: totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0,
                rating: advocate.rating, totalReviews: advocate.totalReviews
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

export default router;
