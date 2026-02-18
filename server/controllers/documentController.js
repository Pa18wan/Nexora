import { db, generateId, queryToArray } from '../config/firebase.js';
import deepseekService from '../services/deepseek.js';
import path from 'path';
import fs from 'fs';

/**
 * Upload Document
 */
export const upload = async (req, res) => {
    try {
        const userId = req.user._id;
        const caseId = req.params.caseId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const caseSnapshot = await db.ref('cases/' + caseId).once('value');
        if (!caseSnapshot.exists()) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseSnapshot.val();

        // Validate Access
        if (caseData.clientId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const documentId = generateId();
        const document = {
            caseId,
            userId,
            title: req.body.title || file.originalname,
            originalName: file.originalname,
            fileType: file.mimetype,
            filePath: file.path,
            size: file.size,
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.ref('documents/' + documentId).set(document);

        // Notify
        if (caseData.advocateId) {
            // Get advocate's userId
            const advSnapshot = await db.ref('advocates/' + caseData.advocateId).once('value');
            if (advSnapshot.exists()) {
                await db.ref('notifications').push({
                    userId: advSnapshot.val().userId,
                    type: 'document_uploaded',
                    title: 'New Document Uploaded',
                    message: `New document "${document.title}" uploaded to "${caseData.title}"`,
                    data: { caseId, documentId },
                    isRead: false,
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Log activity
        await db.ref('activityLogs').push({
            userId,
            action: 'document_upload',
            entityType: 'document',
            entityId: documentId,
            details: { caseId, fileName: document.originalName },
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: { document: { _id: documentId, ...document } }
        });

    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload document' });
    }
};

/**
 * Get Documents for a Case
 */
export const listDocuments = async (req, res) => {
    try {
        const userId = req.user._id;
        const caseId = req.params.caseId;

        const caseSnapshot = await db.ref('cases/' + caseId).once('value');
        if (!caseSnapshot.exists()) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseSnapshot.val();
        if (caseData.clientId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const docsSnap = await db.ref('documents')
            .orderByChild('caseId')
            .equalTo(caseId)
            .once('value');

        const documents = queryToArray(docsSnap);
        documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        res.json({ success: true, data: { documents } });

    } catch (error) {
        console.error('List documents error:', error);
        res.status(500).json({ success: false, error: 'Failed to list documents' });
    }
};

/**
 * Download Document
 */
export const download = async (req, res) => {
    try {
        const userId = req.user._id;
        const documentId = req.params.id;

        const docSnapshot = await db.ref('documents/' + documentId).once('value');
        if (!docSnapshot.exists()) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        const document = docSnapshot.val();

        // Log download
        await db.ref('activityLogs').push({
            userId,
            action: 'document_download',
            entityType: 'document',
            entityId: documentId,
            createdAt: new Date().toISOString()
        });

        res.download(document.filePath, document.originalName);

    } catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({ success: false, error: 'Failed to download document' });
    }
};

/**
 * List all documents for a user
 */
export const listAllDocuments = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        // Get all cases belonging to this user
        let caseIds = [];

        if (req.user.role === 'client') {
            const casesSnap = await db.ref('cases')
                .orderByChild('clientId')
                .equalTo(userId)
                .once('value');
            caseIds = queryToArray(casesSnap).map(c => c._id);
        } else if (req.user.role === 'advocate') {
            const advSnap = await db.ref('advocates')
                .orderByChild('userId')
                .equalTo(userId)
                .limitToFirst(1)
                .once('value');
            if (advSnap.exists()) {
                const advocates = queryToArray(advSnap);
                const casesSnap = await db.ref('cases')
                    .orderByChild('advocateId')
                    .equalTo(advocates[0]._id)
                    .once('value');
                caseIds = queryToArray(casesSnap).map(c => c._id);
            }
        } else {
            // Admin - get all
            const casesSnap = await db.ref('cases').once('value');
            caseIds = queryToArray(casesSnap).map(c => c._id);
        }

        if (caseIds.length === 0) {
            return res.json({
                success: true,
                data: { documents: [], pagination: { currentPage: 1, totalPages: 0, totalDocuments: 0 } }
            });
        }

        // RTDB doesn't support 'in' queries, so fetch all documents and filter
        // Optimization: In a real app we would query documents by caseId for each case, but here we fetch all for simplicity
        const docsSnap = await db.ref('documents').once('value');
        let allDocuments = queryToArray(docsSnap);
        allDocuments = allDocuments.filter(d => caseIds.includes(d.caseId));

        allDocuments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        const totalDocuments = allDocuments.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const documents = allDocuments.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                documents,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDocuments / parseInt(limit)),
                    totalDocuments
                }
            }
        });

    } catch (error) {
        console.error('List all documents error:', error);
        res.status(500).json({ success: false, error: 'Failed to list documents' });
    }
};
