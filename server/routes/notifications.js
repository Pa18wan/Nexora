import express from 'express';
import { db, generateId, queryToArray } from '../config/firebase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;

        let allNotifs = [];

        if (unreadOnly === 'true') {
            const snap = await db.collection('notifications')
                .where('userId', '==', req.user._id)
                .where('isRead', '==', false)
                .orderBy('createdAt', 'desc')
                .get();
            allNotifs = queryToArray(snap);
        } else {
            const snap = await db.collection('notifications')
                .where('userId', '==', req.user._id)
                .orderBy('createdAt', 'desc')
                .get();
            allNotifs = queryToArray(snap);
        }

        const unreadSnap = await db.collection('notifications')
            .where('userId', '==', req.user._id)
            .where('isRead', '==', false)
            .get();
        const unreadCount = unreadSnap.size;

        const total = allNotifs.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const notifications = allNotifs.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notifDoc = await db.collection('notifications').doc(req.params.id).get();
        if (!notifDoc.exists || notifDoc.data().userId !== req.user._id) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await db.collection('notifications').doc(req.params.id).update({
            isRead: true,
            readAt: new Date().toISOString()
        });

        res.json({ success: true, data: { _id: req.params.id, ...notifDoc.data(), isRead: true } });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
    try {
        const unreadSnap = await db.collection('notifications')
            .where('userId', '==', req.user._id)
            .where('isRead', '==', false)
            .get();

        const batch = db.batch();
        unreadSnap.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true, readAt: new Date().toISOString() });
        });
        await batch.commit();

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
});

export default router;
