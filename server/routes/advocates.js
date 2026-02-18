import express from 'express';
import { db, generateId, queryToArray, docToObj } from '../config/firebase.js';
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

        const advSnap = await db.ref('advocates')
            .orderByChild('isVerified')
            .equalTo(true)
            .once('value');

        let advocates = queryToArray(advSnap);

        // Filter by specialization
        if (specialization) {
            const specs = specialization.split(',');
            advocates = advocates.filter(a =>
                a.specialization && a.specialization.some(s => specs.includes(s))
            );
        }

        // Filter by city
        if (city) {
            const cityLower = city.toLowerCase();
            advocates = advocates.filter(a =>
                (a.officeAddress?.city || a.location?.city || '').toLowerCase().includes(cityLower)
            );
        }

        // Filter by experience
        if (minExperience) {
            advocates = advocates.filter(a => (a.experienceYears || 0) >= parseInt(minExperience));
        }

        // Filter by rating
        if (minRating) {
            advocates = advocates.filter(a => (a.rating || 0) >= parseFloat(minRating));
        }

        // Enrich with user info
        for (let adv of advocates) {
            if (adv.userId) {
                const uSnapshot = await db.ref('users/' + adv.userId).once('value');
                if (uSnapshot.exists()) {
                    adv.user = { _id: adv.userId, name: uSnapshot.val().name, email: uSnapshot.val().email, avatar: uSnapshot.val().avatar };
                }
            }
        }

        // Filter by search (name)
        if (search) {
            const searchLower = search.toLowerCase();
            advocates = advocates.filter(a =>
                (a.user?.name || '').toLowerCase().includes(searchLower)
            );
        }

        // Sort
        if (sortBy === 'experience') {
            advocates.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
        } else {
            advocates.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        const total = advocates.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        advocates = advocates.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: { advocates, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }
        });
    } catch (error) {
        console.error('Get advocates error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch advocates' });
    }
});

// Get advocate by ID
router.get('/:id', async (req, res) => {
    try {
        const advSnapshot = await db.ref('advocates/' + req.params.id).once('value');
        if (!advSnapshot.exists()) return res.status(404).json({ success: false, message: 'Advocate not found' });

        const advocate = { _id: advSnapshot.key, ...advSnapshot.val() };
        const advocateId = advSnapshot.key;

        // Enrich with user info
        if (advocate.userId) {
            const uSnapshot = await db.ref('users/' + advocate.userId).once('value');
            if (uSnapshot.exists()) {
                const { password, ...userData } = uSnapshot.val();
                advocate.user = { _id: advocate.userId, ...userData };
            }
        }

        // Case stats
        const casesSnap = await db.ref('cases')
            .orderByChild('advocateId')
            .equalTo(advocateId)
            .once('value');
        const allCases = queryToArray(casesSnap);
        const resolvedCases = allCases.filter(c => c.status === 'resolved').length;

        advocate.statistics = {
            totalCases: allCases.length,
            resolvedCases,
            successRate: allCases.length > 0 ? Math.round((resolvedCases / allCases.length) * 100) : 0
        };

        res.json({ success: true, data: advocate });
    } catch (error) {
        console.error('Get advocate error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch advocate' });
    }
});

// Update advocate profile
router.put('/profile', protect, authorize('advocate'), async (req, res) => {
    try {
        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(req.user._id)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) return res.status(404).json({ success: false, message: 'Advocate profile not found' });

        const advocatesArr = queryToArray(advSnap);
        const advocateId = advocatesArr[0]._id;
        const updateFields = ['specialization', 'experienceYears', 'education', 'certifications',
            'courtsPracticed', 'languages', 'consultationFee', 'availability', 'officeAddress', 'bio', 'isAcceptingCases'];

        const updateData = { updatedAt: new Date().toISOString() };
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        await db.ref('advocates/' + advocateId).update(updateData);

        const updatedSnapshot = await db.ref('advocates/' + advocateId).once('value');

        res.json({ success: true, message: 'Profile updated successfully', data: { _id: advocateId, ...updatedSnapshot.val() } });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// Advocate dashboard stats
router.get('/dashboard/stats', protect, authorize('advocate'), async (req, res) => {
    try {
        const advSnap = await db.ref('advocates')
            .orderByChild('userId')
            .equalTo(req.user._id)
            .limitToFirst(1)
            .once('value');

        if (!advSnap.exists()) return res.status(404).json({ success: false, message: 'Advocate profile not found' });

        const advocatesArr = queryToArray(advSnap);
        const advocate = advocatesArr[0];

        const casesSnap = await db.ref('cases')
            .orderByChild('advocateId')
            .equalTo(advocate._id)
            .once('value');
        const allCases = queryToArray(casesSnap);

        const activeCases = allCases.filter(c => ['advocate_assigned', 'in_progress', 'assigned'].includes(c.status)).length;
        const urgentCases = allCases.filter(c =>
            ['advocate_assigned', 'in_progress'].includes(c.status) &&
            ['high', 'critical'].includes(c.aiAnalysis?.urgencyLevel || c.urgencyLevel)
        ).length;
        const resolvedCases = allCases.filter(c => c.status === 'resolved').length;
        const totalCases = allCases.length;

        // Pending requests (cases where this advocate is recommended but not yet assigned)
        const pendingSnap = await db.ref('cases')
            .orderByChild('status')
            .equalTo('pending_advocate')
            .once('value');
        const pendingCases = queryToArray(pendingSnap);
        const pendingRequests = pendingCases.filter(c =>
            c.recommendedAdvocates && c.recommendedAdvocates.some(r => r.advocateId === advocate._id)
        ).length;

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
