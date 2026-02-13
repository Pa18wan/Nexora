import express from 'express';
import Case from '../models/Case.js';
import Advocate from '../models/Advocate.js';
import AILog from '../models/AILog.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { analyzeCase, matchAdvocates } from '../config/deepseek.js';

const router = express.Router();

// Submit new case with AI analysis
router.post('/', protect, authorize('client'), async (req, res) => {
    try {
        const { title, description, category, location, clientNotes } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Please provide title, description, and category' });
        }

        const newCase = await Case.create({
            clientId: req.user._id,
            title, description, category, location, clientNotes,
            status: 'analyzing',
            timeline: [{ event: 'Case Submitted', description: 'Case was submitted for AI analysis', createdBy: req.user._id }]
        });

        const startTime = Date.now();
        const aiAnalysis = await analyzeCase({ title, description, category });
        const latencyMs = Date.now() - startTime;

        newCase.aiAnalysis = { ...aiAnalysis, analyzedAt: new Date() };
        newCase.status = 'pending_advocate';
        newCase.priority = aiAnalysis.urgencyLevel === 'critical' ? 'urgent' :
            aiAnalysis.urgencyLevel === 'high' ? 'high' : 'normal';

        newCase.timeline.push({
            event: 'AI Analysis Complete',
            description: `Urgency: ${aiAnalysis.urgencyLevel}, Risk Score: ${aiAnalysis.riskScore}`,
            createdBy: req.user._id
        });

        const advocates = await Advocate.find({
            verificationStatus: 'verified',
            isAcceptingCases: true,
            specialization: { $in: aiAnalysis.requiredSpecialization }
        }).populate('userId', 'name email').limit(10);

        let advocateMatches = [];
        if (advocates.length > 0) {
            advocateMatches = await matchAdvocates(aiAnalysis, advocates);
            newCase.recommendedAdvocates = advocateMatches.map(match => ({
                advocateId: match.advocateId,
                matchScore: match.matchScore,
                reason: match.reason
            }));
        }

        await newCase.save();

        await AILog.create({
            caseId: newCase._id, userId: req.user._id, type: 'case_analysis',
            input: { title, description, category }, output: aiAnalysis, latencyMs, status: 'success'
        });

        await Notification.create({
            userId: req.user._id, type: 'case_update', title: 'Case Analyzed',
            message: `Your case "${title}" has been analyzed. Urgency: ${aiAnalysis.urgencyLevel}`,
            relatedCase: newCase._id, priority: aiAnalysis.urgencyLevel === 'critical' ? 'urgent' : 'normal'
        });

        res.status(201).json({
            success: true,
            message: 'Case submitted and analyzed successfully',
            data: { case: newCase, analysis: aiAnalysis, recommendedAdvocates: advocateMatches.slice(0, 5) }
        });
    } catch (error) {
        console.error('Case submission error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to submit case' });
    }
});

// Get cases
router.get('/', protect, async (req, res) => {
    try {
        const { status, urgency, page = 1, limit = 10 } = req.query;
        const query = {};

        if (req.user.role === 'client') {
            query.clientId = req.user._id;
        } else if (req.user.role === 'advocate') {
            const advocate = await Advocate.findOne({ userId: req.user._id });
            if (advocate) query.advocateId = advocate._id;
        }

        if (status) query.status = status;
        if (urgency) query['aiAnalysis.urgencyLevel'] = urgency;

        const cases = await Case.find(query)
            .populate('clientId', 'name email')
            .populate({ path: 'advocateId', populate: { path: 'userId', select: 'name email' } })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Case.countDocuments(query);

        res.json({
            success: true,
            data: { cases, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
        });
    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
});

// Get single case
router.get('/:id', protect, async (req, res) => {
    try {
        const caseData = await Case.findById(req.params.id)
            .populate('clientId', 'name email phone')
            .populate({ path: 'advocateId', populate: { path: 'userId', select: 'name email' } })
            .populate({ path: 'recommendedAdvocates.advocateId', populate: { path: 'userId', select: 'name email' } })
            .populate('timeline.createdBy', 'name');

        if (!caseData) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        const isClient = caseData.clientId._id.toString() === req.user._id.toString();
        const advocate = await Advocate.findOne({ userId: req.user._id });
        const isAssignedAdvocate = advocate && caseData.advocateId?._id.toString() === advocate._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isClient && !isAssignedAdvocate && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this case' });
        }

        res.json({ success: true, data: caseData });
    } catch (error) {
        console.error('Get case error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch case' });
    }
});

// Assign advocate
router.put('/:id/assign', protect, authorize('client'), async (req, res) => {
    try {
        const { advocateId } = req.body;
        const caseData = await Case.findById(req.params.id);

        if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });
        if (caseData.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const advocate = await Advocate.findById(advocateId).populate('userId', 'name email');
        if (!advocate) return res.status(404).json({ success: false, message: 'Advocate not found' });

        caseData.advocateId = advocateId;
        caseData.status = 'advocate_assigned';
        caseData.timeline.push({
            event: 'Advocate Assigned',
            description: `${advocate.userId.name} has been assigned to this case`,
            createdBy: req.user._id
        });

        await caseData.save();

        await Notification.create({
            userId: advocate.userId._id, type: 'case_update', title: 'New Case Assigned',
            message: `You have been assigned to case: ${caseData.title}`,
            relatedCase: caseData._id, priority: caseData.priority === 'urgent' ? 'urgent' : 'high'
        });

        res.json({ success: true, message: 'Advocate assigned successfully', data: caseData });
    } catch (error) {
        console.error('Assign advocate error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign advocate' });
    }
});

// Update case status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const caseData = await Case.findById(req.params.id);

        if (!caseData) return res.status(404).json({ success: false, message: 'Case not found' });

        const oldStatus = caseData.status;
        caseData.status = status;

        if (status === 'resolved' || status === 'closed') {
            caseData.closedDate = new Date();
        }

        caseData.timeline.push({
            event: 'Status Updated',
            description: `Status changed from ${oldStatus} to ${status}. ${notes || ''}`,
            createdBy: req.user._id
        });

        await caseData.save();

        await Notification.create({
            userId: caseData.clientId, type: 'case_update', title: 'Case Status Updated',
            message: `Your case status has been updated to: ${status}`, relatedCase: caseData._id
        });

        res.json({ success: true, message: 'Case status updated', data: caseData });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

export default router;
