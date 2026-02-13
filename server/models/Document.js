import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    filePath: { type: String, required: true },
    category: {
        type: String,
        enum: ['evidence', 'petition', 'affidavit', 'court_order', 'judgment',
            'contract', 'identity', 'property', 'financial', 'correspondence', 'other'],
        default: 'other'
    },
    description: { type: String, maxlength: 500 },
    version: { type: Number, default: 1 },
    previousVersions: [{ filePath: String, version: Number, uploadedAt: Date }],
    isConfidential: { type: Boolean, default: true },
    accessLog: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, enum: ['viewed', 'downloaded', 'updated', 'deleted'] },
        timestamp: { type: Date, default: Date.now },
        ipAddress: String
    }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

documentSchema.index({ caseId: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
