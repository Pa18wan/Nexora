import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/users', adminController.getUsers);
router.put('/users/:userId/status', adminController.updateUserStatus); // suspend/block

router.get('/advocates', adminController.getAllAdvocates);
router.get('/advocates/pending', adminController.getPendingAdvocates);
router.put('/advocates/:advocateId/verify', adminController.verifyAdvocate); // approve/reject

router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

router.get('/complaints', adminController.getComplaints);
router.put('/complaints/:complaintId/resolve', adminController.resolveComplaint);

router.get('/analytics', adminController.getAnalytics);

export default router;
