import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    againstUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    againstAdvocate: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate' },
    type: {
        type: String,
        enum: ['misconduct', 'delay', 'overcharging', 'unprofessional',
            'communication', 'technical_issue', 'other'],
        required: true
    },
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, minlength: 20 },
    evidence: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'investigating', 'resolved', 'dismissed'],
        default: 'submitted'
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNotes: [{
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    resolution: {
        action: String,
        description: String,
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: Date
    }
}, { timestamps: true });

complaintSchema.index({ raisedBy: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
