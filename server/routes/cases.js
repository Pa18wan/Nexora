import express from 'express';
import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';
import { protect, authorize } from '../middleware/auth.js';
import deepseekService from '../services/deepseek.js';

const router = express.Router();

// Submit new case with AI analysis
router.post('/', protect, authorize('client'), async (req, res) => {
    try {
        const { title, description, category, location, clientNotes } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Please provide title, description, and category' });
        }

        const caseId = generateId();
        const now = new Date().toISOString();

        const newCase = {
            clientId: req.user._id,
            title, description, category,
            location: location || {},
            clientNotes: clientNotes || '',
            status: 'analyzing',
            urgencyLevel: 'medium',
            aiAnalysis: {},
            recommendedAdvocates: [],
            timeline: [{ event: 'Case Submitted', description: 'Case was submitted for AI analysis', createdBy: req.user._id, createdAt: now }],
            createdAt: now,
            updatedAt: now
        };

        // AI analysis
        try {
            const aiAnalysis = await deepseekService.classifyCase(description, { location, category });

            if (aiAnalysis && aiAnalysis.success && aiAnalysis.data) {
                newCase.aiAnalysis = { ...aiAnalysis.data, analyzedAt: now };
                newCase.urgencyLevel = aiAnalysis.data.urgencyLevel || 'medium';

                newCase.timeline.push({
                    event: 'AI Analysis Complete',
                    description: `Urgency: ${newCase.urgencyLevel}`,
                    createdBy: req.user._id,
                    createdAt: now
                });
            }
        } catch (e) {
            console.warn('AI analysis failed:', e.message);
        }

        newCase.status = 'pending_advocate';
        await db.ref('cases/' + caseId).set(newCase);

        // Log AI interaction
        try {
            await db.ref('aiLogs').push({
                caseId, userId: req.user._id, type: 'case_analysis',
                input: { title, description, category },
                output: newCase.aiAnalysis,
                status: 'success',
                createdAt: now
            });
        } catch (e) { /* ignore */ }

        // Notification
        try {
            await db.ref('notifications').push({
                userId: req.user._id, type: 'case_update', title: 'Case Analyzed',
                message: `Your case "${title}" has been analyzed. Urgency: ${newCase.urgencyLevel}`,
                relatedCase: caseId,
                isRead: false,
                createdAt: now
            });
        } catch (e) { /* ignore */ }

        res.status(201).json({
            success: true,
            message: 'Case submitted and analyzed successfully',
            data: { case: { _id: caseId, ...newCase }, analysis: newCase.aiAnalysis }
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

        let allCases = [];

        if (req.user.role === 'client') {
            const snap = await db.ref('cases')
                .orderByChild('clientId')
                .equalTo(req.user._id)
                .once('value');
            allCases = queryToArray(snap);
        } else if (req.user.role === 'advocate') {
            const advSnap = await db.ref('advocates')
                .orderByChild('userId')
                .equalTo(req.user._id)
                .limitToFirst(1)
                .once('value');
            if (advSnap.exists()) {
                const advocates = queryToArray(advSnap);
                const snap = await db.ref('cases')
                    .orderByChild('advocateId')
                    .equalTo(advocates[0]._id)
                    .once('value');
                allCases = queryToArray(snap);
            }
        } else {
            // admin
            const snap = await db.ref('cases').once('value');
            allCases = queryToArray(snap);
        }

        if (status) allCases = allCases.filter(c => c.status === status);
        if (urgency) allCases = allCases.filter(c => c.aiAnalysis?.urgencyLevel === urgency || c.urgencyLevel === urgency);

        // Enrich with user info
        for (let c of allCases) {
            if (c.clientId) {
                const uSnapshot = await db.ref('users/' + c.clientId).once('value');
                if (uSnapshot.exists()) {
                    c.clientName = uSnapshot.val().name;
                    c.clientEmail = uSnapshot.val().email;
                }
            }
        }

        allCases.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const total = allCases.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const cases = allCases.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: { cases, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }
        });
    } catch (error) {
        console.error('Get cases error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
});

// Get single case
router.get('/:id', protect, async (req, res) => {
    try {
        const caseSnapshot = await db.ref('cases/' + req.params.id).once('value');
        if (!caseSnapshot.exists()) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        const caseData = { _id: caseSnapshot.key, ...caseSnapshot.val() };
        const caseId = caseSnapshot.key;

        // Enrich with client info
        if (caseData.clientId) {
            const clientSnapshot = await db.ref('users/' + caseData.clientId).once('value');
            if (clientSnapshot.exists()) {
                const { password, ...clientData } = clientSnapshot.val();
                caseData.client = { _id: caseData.clientId, ...clientData };
            }
        }

        // Enrich with advocate info
        if (caseData.advocateId) {
            const advSnapshot = await db.ref('advocates/' + caseData.advocateId).once('value');
            if (advSnapshot.exists()) {
                const advData = advSnapshot.val();
                caseData.advocate = { _id: caseData.advocateId, ...advData };
                if (advData.userId) {
                    const advUserSnapshot = await db.ref('users/' + advData.userId).once('value');
                    if (advUserSnapshot.exists()) {
                        caseData.advocate.user = { _id: advData.userId, name: advUserSnapshot.val().name, email: advUserSnapshot.val().email };
                    }
                }
            }
        }

        // Access check
        const isClient = caseData.clientId === req.user._id;
        let isAssignedAdvocate = false;
        if (req.user.role === 'advocate') {
            const advSnap = await db.ref('advocates')
                .orderByChild('userId')
                .equalTo(req.user._id)
                .limitToFirst(1)
                .once('value');
            if (advSnap.exists()) {
                const advocates = queryToArray(advSnap);
                if (caseData.advocateId === advocates[0]._id) {
                    isAssignedAdvocate = true;
                }
            }
        }
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
        const caseSnapshot = await db.ref('cases/' + req.params.id).once('value');

        if (!caseSnapshot.exists()) return res.status(404).json({ success: false, message: 'Case not found' });
        const caseData = caseSnapshot.val();

        if (caseData.clientId !== req.user._id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const advSnapshot = await db.ref('advocates/' + advocateId).once('value');
        if (!advSnapshot.exists()) return res.status(404).json({ success: false, message: 'Advocate not found' });

        const advData = advSnapshot.val();
        let advocateName = 'Advocate';
        if (advData.userId) {
            const uSnapshot = await db.ref('users/' + advData.userId).once('value');
            if (uSnapshot.exists()) advocateName = uSnapshot.val().name;
        }

        const timeline = caseData.timeline || [];
        timeline.push({
            event: 'Advocate Assigned',
            description: `${advocateName} has been assigned to this case`,
            createdBy: req.user._id,
            createdAt: new Date().toISOString()
        });

        await db.ref('cases/' + req.params.id).update({
            advocateId,
            status: 'advocate_assigned',
            timeline,
            updatedAt: new Date().toISOString()
        });

        // Notify advocate
        if (advData.userId) {
            await db.ref('notifications').push({
                userId: advData.userId, type: 'case_update', title: 'New Case Assigned',
                message: `You have been assigned to case: ${caseData.title}`,
                relatedCase: req.params.id,
                isRead: false,
                createdAt: new Date().toISOString()
            });
        }

        res.json({ success: true, message: 'Advocate assigned successfully' });
    } catch (error) {
        console.error('Assign advocate error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign advocate' });
    }
});

// Update case status
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const caseSnapshot = await db.ref('cases/' + req.params.id).once('value');

        if (!caseSnapshot.exists()) return res.status(404).json({ success: false, message: 'Case not found' });
        const caseData = caseSnapshot.val();

        const oldStatus = caseData.status;
        const timeline = caseData.timeline || [];
        timeline.push({
            event: 'Status Updated',
            description: `Status changed from ${oldStatus} to ${status}. ${notes || ''}`,
            createdBy: req.user._id,
            createdAt: new Date().toISOString()
        });

        const updateData = {
            status, timeline,
            updatedAt: new Date().toISOString()
        };

        if (status === 'resolved' || status === 'closed') {
            updateData.closedDate = new Date().toISOString();
        }

        await db.ref('cases/' + req.params.id).update(updateData);

        // Notify client
        await db.ref('notifications').push({
            userId: caseData.clientId, type: 'case_update', title: 'Case Status Updated',
            message: `Your case status has been updated to: ${status}`,
            relatedCase: req.params.id,
            isRead: false,
            createdAt: new Date().toISOString()
        });

        res.json({ success: true, message: 'Case status updated' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

export default router;
