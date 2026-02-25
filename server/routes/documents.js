import express from 'express';
import { protect } from '../middleware/auth.js';
import * as documentController from '../controllers/documentController.js';
import multer from 'multer';
import os from 'os';
import path from 'path';

// On Vercel serverless, only /tmp is writable; locally use 'uploads/'
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : 'uploads/';
const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.use(protect);

// List all documents for current user
router.get('/', documentController.listAllDocuments);

router.post('/cases/:caseId/upload', upload.single('file'), documentController.upload);
router.get('/cases/:caseId', documentController.listDocuments);
router.get('/:id/download', documentController.download);


export default router;

