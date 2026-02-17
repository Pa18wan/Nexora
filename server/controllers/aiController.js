import deepseekService from '../services/deepseek.js';
import { db, generateId, queryToArray } from '../config/firebase.js';

/**
 * Handle AI Chat - Enhanced with situational suggestions
 */
export const chat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { message, caseId } = req.body;

        let caseContext = null;

        if (caseId) {
            const caseDoc = await db.collection('cases').doc(caseId).get();
            if (caseDoc.exists) {
                const caseData = caseDoc.data();
                if (caseData.clientId === userId) {
                    caseContext = {
                        title: caseData.title,
                        description: caseData.description,
                        category: caseData.category,
                        status: caseData.status,
                        urgencyLevel: caseData.urgencyLevel,
                        aiAnalysis: caseData.aiAnalysis
                    };
                }
            }
        }

        // Get recent conversation history from Firestore
        const recentLogsSnap = await db.collection('aiLogs')
            .where('userId', '==', userId)
            .get();

        let recentLogs = queryToArray(recentLogsSnap);
        recentLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        recentLogs = recentLogs.slice(0, 5);



        const conversationHistory = recentLogs.flatMap(log => {
            return [
                { role: 'user', content: String(log.input) },
                { role: 'assistant', content: String(log.output || '') }
            ];
        }).reverse();

        const result = await deepseekService.legalChat(message, caseContext, conversationHistory);

        // Log interaction to Firestore
        await deepseekService.logInteraction(userId, 'chat', message, result.data ? result.data.response : 'No response', caseId);

        if (!result.success) {
            return res.status(500).json({ success: false, error: 'AI processing failed' });
        }

        res.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ success: false, error: 'Failed to process chat' });
    }
};

/**
 * Get AI Logs
 */
export const getLogs = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        let query;
        if (req.user.role === 'admin') {
            query = db.collection('aiLogs').orderBy('createdAt', 'desc');
        } else {
            query = db.collection('aiLogs')
                .where('userId', '==', userId);
        }

        const logsSnap = await query.get();
        let logs = queryToArray(logsSnap);

        if (req.user.role !== 'admin') {
            logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const total = logs.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        logs = logs.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get AI logs error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
};
