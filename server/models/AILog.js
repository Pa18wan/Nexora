import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema({
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['case_analysis', 'advocate_matching', 'chat_response', 'urgency_prediction', 'search_query'],
        required: true
    },
    input: { type: mongoose.Schema.Types.Mixed, required: true },
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    model: { type: String, default: 'deepseek-chat' },
    tokensUsed: { prompt: Number, completion: Number, total: Number },
    latencyMs: { type: Number },
    status: { type: String, enum: ['success', 'error', 'timeout'], default: 'success' },
    errorMessage: String,
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

aiLogSchema.index({ caseId: 1 });
aiLogSchema.index({ type: 1 });
aiLogSchema.index({ createdAt: -1 });

const AILog = mongoose.model('AILog', aiLogSchema);

export default AILog;
