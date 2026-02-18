import express from 'express';
import { db, generateId, queryToArray } from '../config/firebase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;

        const snap = await db.ref('notifications')
            .orderByChild('userId')
            .equalTo(req.user._id)
            .once('value');

        let allNotifs = queryToArray(snap);

        if (unreadOnly === 'true') {
            allNotifs = allNotifs.filter(n => n.isRead === false);
        }

        // Sort in memory to avoid Firestore index requirement
        allNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const unreadCount = allNotifs.filter(n => n.isRead === false).length;

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
        const notifSnapshot = await db.ref('notifications/' + req.params.id).once('value');
        if (!notifSnapshot.exists() || notifSnapshot.val().userId !== req.user._id) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await db.ref('notifications/' + req.params.id).update({
            isRead: true,
            readAt: new Date().toISOString()
        });

        const updatedData = notifSnapshot.val();

        res.json({ success: true, data: { _id: req.params.id, ...updatedData, isRead: true } });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
    try {
        const snap = await db.ref('notifications')
            .orderByChild('userId')
            .equalTo(req.user._id)
            .once('value');

        const updates = {};
        const now = new Date().toISOString();

        snap.forEach(childSnap => {
            if (childSnap.val().isRead === false) {
                updates['notifications/' + childSnap.key + '/isRead'] = true;
                updates['notifications/' + childSnap.key + '/readAt'] = now;
            }
        });

        if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
        }

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
});

export default router;
