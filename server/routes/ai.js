import express from 'express';
import { protect } from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

router.use(protect);

router.post('/chat', aiController.chat);
router.get('/logs', aiController.getLogs);

export default router;
