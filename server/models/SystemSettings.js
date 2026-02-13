import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['general', 'ai', 'case', 'advocate', 'notification', 'security', 'payment']
    },
    description: String,
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Default system settings
systemSettingsSchema.statics.getDefaults = function () {
    return {
        // AI Settings
        urgencyThreshold: { key: 'urgencyThreshold', value: 70, category: 'ai', description: 'Minimum score to flag as urgent' },
        aiMatchMinScore: { key: 'aiMatchMinScore', value: 60, category: 'ai', description: 'Minimum AI match score for recommendations' },

        // Case Settings
        autoReassignHours: { key: 'autoReassignHours', value: 24, category: 'case', description: 'Hours before auto-reassign' },
        maxCasesPerAdvocate: { key: 'maxCasesPerAdvocate', value: 15, category: 'case', description: 'Max concurrent cases per advocate' },

        // Payment Settings
        commissionRate: { key: 'commissionRate', value: 10, category: 'payment', description: 'Platform commission percentage' },

        // Security Settings
        maxLoginAttempts: { key: 'maxLoginAttempts', value: 5, category: 'security', description: 'Max failed login attempts before lockout' },
        sessionTimeout: { key: 'sessionTimeout', value: 24, category: 'security', description: 'Session timeout in hours' },

        // File Settings
        maxFileSizeMB: { key: 'maxFileSizeMB', value: 10, category: 'general', description: 'Maximum file upload size in MB' },
        allowedFileTypes: { key: 'allowedFileTypes', value: ['pdf', 'doc', 'docx', 'jpg', 'png'], category: 'general', description: 'Allowed file types' }
    };
};

export default mongoose.model('SystemSettings', systemSettingsSchema);
