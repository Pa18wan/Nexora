import Document from '../models/Document.js';
import Case from '../models/Case.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
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

        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        // Validate Access
        if (!caseData.clientId.equals(userId) && (!caseData.advocateId || !caseData.advocateId.userId.equals(userId)) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized to upload documents to this case' });
        }

        // Create document entry
        const document = new Document({
            caseId,
            userId,
            title: req.body.title || file.originalname,
            originalName: file.originalname,
            fileType: file.mimetype,
            filePath: file.path,
            size: file.size,
            isVerified: false
        });

        await document.save();

        // Optional: Analyze with AI
        if (req.body.analyze === 'true') {
            // Basic text extraction simulation or call service
            // For now assume deepseek.analyzeDocument takes text
        }

        // Notify
        const recipient = caseData.clientId.equals(userId) ? caseData.advocateId?.userId : caseData.clientId;
        if (recipient) {
            await Notification.create({
                userId: recipient,
                type: 'document_uploaded',
                title: 'New Document Uploaded',
                message: `New document "${document.title}" uploaded to "${caseData.title}"`,
                data: { caseId, documentId: document._id }
            });
        }

        // Log activity
        await ActivityLog.create({
            userId,
            action: 'document_upload',
            entityType: 'document',
            entityId: document._id,
            details: { caseId, fileName: document.originalName }
        });

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: { document }
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

        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        // Validate Access
        if (!caseData.clientId.equals(userId) && (!caseData.advocateId || !caseData.advocateId.userId.equals(userId)) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const documents = await Document.find({ caseId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { documents }
        });

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

        const document = await Document.findById(documentId).populate('caseId');
        if (!document) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Validate Access
        const caseData = await Case.findById(document.caseId);
        if (!caseData.clientId.equals(userId) && (!caseData.advocateId || !caseData.advocateId.userId.equals(userId)) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Log download
        await ActivityLog.create({
            userId,
            action: 'document_download',
            entityType: 'document',
            entityId: document._id
        });

        // Send file
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

        // Get all cases the user is a part of
        let casesQuery = {};
        if (req.user.role === 'client') {
            casesQuery = { clientId: userId };
        } else if (req.user.role === 'advocate') {
            const Advocate = (await import('../models/Advocate.js')).default;
            const advocate = await Advocate.findOne({ userId });
            if (advocate) {
                casesQuery = { advocateId: advocate._id };
            }
        }
        // Admin can see all

        const userCases = await Case.find(casesQuery).select('_id');
        const caseIds = userCases.map(c => c._id);

        const documents = await Document.find({ caseId: { $in: caseIds } })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('caseId', 'title');

        const totalDocuments = await Document.countDocuments({ caseId: { $in: caseIds } });

        res.json({
            success: true,
            data: {
                documents,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDocuments / limit),
                    totalDocuments
                }
            }
        });

    } catch (error) {
        console.error('List all documents error:', error);
        res.status(500).json({ success: false, error: 'Failed to list documents' });
    }
};

