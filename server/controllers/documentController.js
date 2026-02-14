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

        const caseDoc = await db.collection('cases').doc(caseId).get();
        if (!caseDoc.exists) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseDoc.data();

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

        await db.collection('documents').doc(documentId).set(document);

        // Notify
        if (caseData.advocateId) {
            // Get advocate's userId
            const advDoc = await db.collection('advocates').doc(caseData.advocateId).get();
            if (advDoc.exists) {
                await db.collection('notifications').doc(generateId()).set({
                    userId: advDoc.data().userId,
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
        await db.collection('activityLogs').doc(generateId()).set({
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

        const caseDoc = await db.collection('cases').doc(caseId).get();
        if (!caseDoc.exists) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        const caseData = caseDoc.data();
        if (caseData.clientId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const docsSnap = await db.collection('documents')
            .where('caseId', '==', caseId)
            .orderBy('createdAt', 'desc')
            .get();

        const documents = queryToArray(docsSnap);

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

        const docRef = await db.collection('documents').doc(documentId).get();
        if (!docRef.exists) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        const document = docRef.data();

        // Log download
        await db.collection('activityLogs').doc(generateId()).set({
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
            const casesSnap = await db.collection('cases')
                .where('clientId', '==', userId)
                .get();
            caseIds = casesSnap.docs.map(d => d.id);
        } else if (req.user.role === 'advocate') {
            const advSnap = await db.collection('advocates')
                .where('userId', '==', userId)
                .limit(1).get();
            if (!advSnap.empty) {
                const casesSnap = await db.collection('cases')
                    .where('advocateId', '==', advSnap.docs[0].id)
                    .get();
                caseIds = casesSnap.docs.map(d => d.id);
            }
        } else {
            // Admin - get all
            const casesSnap = await db.collection('cases').get();
            caseIds = casesSnap.docs.map(d => d.id);
        }

        if (caseIds.length === 0) {
            return res.json({
                success: true,
                data: { documents: [], pagination: { currentPage: 1, totalPages: 0, totalDocuments: 0 } }
            });
        }

        // Firestore 'in' queries support max 30 items
        let allDocuments = [];
        const chunks = [];
        for (let i = 0; i < caseIds.length; i += 30) {
            chunks.push(caseIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const docsSnap = await db.collection('documents')
                .where('caseId', 'in', chunk)
                .get();
            allDocuments = allDocuments.concat(queryToArray(docsSnap));
        }

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
