import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'user_suspend', 'user_unsuspend', 'user_block', 'user_unblock', 'user_delete',
            'advocate_approve', 'advocate_reject', 'advocate_suspend',
            'case_reassign', 'case_escalate', 'case_freeze', 'case_close',
            'settings_update', 'system_config',
            'ai_log_review', 'complaint_resolve'
        ]
    },
    targetType: {
        type: String,
        required: true,
        enum: ['user', 'advocate', 'case', 'settings', 'complaint', 'ai_log']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    previousState: mongoose.Schema.Types.Mixed,
    newState: mongoose.Schema.Types.Mixed,
    reason: String,
    ipAddress: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
adminLogSchema.index({ adminId: 1, timestamp: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model('AdminLog', adminLogSchema);
