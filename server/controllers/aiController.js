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
            const caseSnapshot = await db.ref('cases/' + caseId).once('value');
            if (caseSnapshot.exists()) {
                const caseData = caseSnapshot.val();
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

        // Get recent conversation history from RTDB
        const recentLogsSnap = await db.ref('aiLogs')
            .orderByChild('userId')
            .equalTo(userId)
            .limitToLast(10)
            .once('value');

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

        let logsSnap;
        if (req.user.role === 'admin') {
            logsSnap = await db.ref('aiLogs').once('value');
        } else {
            logsSnap = await db.ref('aiLogs')
                .orderByChild('userId')
                .equalTo(userId)
                .once('value');
        }

        let logs = queryToArray(logsSnap);

        // Sort by createdAt desc in memory as RTDB sorting is limited
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
