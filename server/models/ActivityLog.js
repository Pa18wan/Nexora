import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login', 'logout', 'register',
            'case_create', 'case_update', 'case_delete', 'case_view',
            'document_upload', 'document_download', 'document_delete',
            'advocate_search', 'advocate_hire', 'advocate_review',
            'ai_chat', 'ai_analysis',
            'profile_update', 'password_change',
            'notification_read'
        ]
    },
    entityType: {
        type: String,
        enum: ['case', 'document', 'advocate', 'user', 'notification', 'ai']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
