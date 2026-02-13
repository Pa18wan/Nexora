import deepseekService from '../services/deepseek.js';
import AILog from '../models/AILog.js';
import Case from '../models/Case.js';

/**
 * Handle AI Chat
 */
export const chat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { message, caseId } = req.body;

        let caseContext = null;

        if (caseId) {
            const caseData = await Case.findById(caseId);
            if (caseData && (caseData.clientId.equals(userId) || (caseData.advocateId && caseData.advocateId.userId.equals(userId)))) {
                caseContext = {
                    title: caseData.title,
                    description: caseData.description,
                    category: caseData.category,
                    status: caseData.status
                };
            }
        }

        // Get recent conversation history
        const recentLogs = await AILog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5);

        const conversationHistory = recentLogs.flatMap(log => {
            // Basic structure assumption
            return [
                { role: 'user', content: String(log.input) },
                { role: 'assistant', content: String(log.output && log.output.data && log.output.data.response || log.output) }
            ];
        }).reverse();

        const result = await deepseekService.legalChat(message, caseContext, conversationHistory);

        // Log interaction
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

        // Admin can see all, users see their own
        const query = req.user.role === 'admin' ? {} : { userId };

        const logs = await AILog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await AILog.countDocuments(query);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get AI logs error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch logs' });
    }
};
