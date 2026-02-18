import express from 'express';
import bcrypt from 'bcryptjs';
import { db, docToObj, queryToArray, generateId } from '../config/firebase.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Check if user exists
        const existingSnapshot = await db.ref('users')
            .orderByChild('email')
            .equalTo(email.toLowerCase())
            .limitToFirst(1)
            .once('value');

        if (existingSnapshot.exists()) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const validRoles = ['client', 'advocate'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = generateId();
        const userData = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'client',
            phone: phone || null,
            avatar: null,
            isVerified: false,
            isActive: true,
            lastLogin: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.ref('users/' + userId).set(userData);

        // If advocate, create advocate profile
        if (role === 'advocate') {
            const advocateId = generateId();
            await db.ref('advocates/' + advocateId).set({
                userId: userId,
                barCouncilId: req.body.barCouncilId || 'PENDING',
                specialization: req.body.specialization || ['General Practice'],
                experienceYears: req.body.experienceYears || 0,
                bio: '',
                rating: 0,
                totalReviews: 0,
                successRate: 0,
                totalCases: 0,
                currentCaseLoad: 0,
                isVerified: false,
                isAvailable: true,
                isActive: true,
                isAcceptingCases: true,
                feeRange: { min: 0, max: 0 },
                location: {},
                languages: ['English'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        const token = generateToken(userId);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: { id: userId, name: userData.name, email: userData.email, role: userData.role },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Registration failed. Please try again.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find user by email
        const userSnapshot = await db.ref('users')
            .orderByChild('email')
            .equalTo(email.toLowerCase())
            .limitToFirst(1)
            .once('value');

        if (!userSnapshot.exists()) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const users = queryToArray(userSnapshot);
        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account has been deactivated' });
        }

        // Update last login
        await db.ref('users/' + user._id).update({
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        const token = generateToken(user._id);

        // Get advocate profile if advocate
        let advocateProfile = null;
        if (user.role === 'advocate') {
            const advSnapshot = await db.ref('advocates')
                .orderByChild('userId')
                .equalTo(user._id)
                .limitToFirst(1)
                .once('value');
            if (advSnapshot.exists()) {
                const advocates = queryToArray(advSnapshot);
                advocateProfile = advocates[0];
            }
        }

        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F8CFF&color=fff`;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: avatarUrl,
                    isVerified: user.isVerified
                },
                advocateProfile,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message || 'Login failed. Please try again.' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        const userSnapshot = await db.ref('users/' + decoded.id).once('value');
        if (!userSnapshot.exists()) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = docToObj(userSnapshot);

        let advocateProfile = null;
        if (user.role === 'advocate') {
            const advSnapshot = await db.ref('advocates')
                .orderByChild('userId')
                .equalTo(user._id)
                .limitToFirst(1)
                .once('value');
            if (advSnapshot.exists()) {
                const advocates = queryToArray(advSnapshot);
                advocateProfile = advocates[0];
            }
        }

        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F8CFF&color=fff`;

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: avatarUrl,
                    isVerified: user.isVerified,
                    phone: user.phone
                },
                advocateProfile
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
});

// Update current user
router.put('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        const userSnapshot = await db.ref('users/' + decoded.id).once('value');
        if (!userSnapshot.exists()) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { name, email, phone, bio } = req.body;
        const updates = { updatedAt: new Date().toISOString() };
        if (name) updates.name = name;
        if (email) updates.email = email.toLowerCase();
        if (phone !== undefined) updates.phone = phone;
        if (bio !== undefined) updates.bio = bio;

        await db.ref('users/' + decoded.id).update(updates);

        const updatedSnapshot = await db.ref('users/' + decoded.id).once('value');
        const user = docToObj(updatedSnapshot);
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F8CFF&color=fff`;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: avatarUrl,
                    isVerified: user.isVerified,
                    phone: user.phone,
                    bio: user.bio
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// Change password
router.put('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        const userSnapshot = await db.ref('users/' + decoded.id).once('value');
        if (!userSnapshot.exists()) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const userData = userSnapshot.val();
        const isMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.ref('users/' + decoded.id).update({
            password: hashedPassword,
            updatedAt: new Date().toISOString()
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

export default router;

