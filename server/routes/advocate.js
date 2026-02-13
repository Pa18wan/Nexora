import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as advocateController from '../controllers/advocateController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('advocate'));

router.get('/dashboard', advocateController.getAdvocateDashboard);
router.get('/cases', advocateController.getAssignedCases);
router.get('/case-requests', advocateController.getCaseRequests);
router.post('/cases/:caseId/respond', advocateController.respondToRequest); // accept/reject
router.put('/cases/:caseId/status', advocateController.updateCaseStatus);
router.get('/analytics', advocateController.getAnalytics);
router.put('/profile', advocateController.updateProfile);
router.put('/availability', advocateController.toggleAvailability);

export default router;

