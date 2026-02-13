import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as clientController from '../controllers/clientController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('client'));

router.get('/dashboard', clientController.getClientDashboard);
router.get('/cases', clientController.getClientCases);
router.post('/cases', clientController.submitCase);

// Advocate recommendations for a specific case
router.get('/cases/:caseId/recommendations', clientController.getAdvocateRecommendations);

// Hire an advocate
router.post('/cases/:caseId/hire', clientController.hireAdvocate);

export default router;
