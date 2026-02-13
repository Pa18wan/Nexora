import express from 'express';
import { protect } from '../middleware/auth.js';
import * as documentController from '../controllers/documentController.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' }); // Basic Multer setup

const router = express.Router();

router.use(protect);

// List all documents for current user
router.get('/', documentController.listAllDocuments);

router.post('/cases/:caseId/upload', upload.single('file'), documentController.upload);
router.get('/cases/:caseId', documentController.listDocuments);
router.get('/:id/download', documentController.download);


export default router;

