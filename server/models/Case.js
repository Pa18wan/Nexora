import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    advocateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate', default: null },
    caseNumber: { type: String, unique: true, sparse: true },
    title: {
        type: String,
        required: [true, 'Case title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Case description is required'],
        minlength: [20, 'Description must be at least 20 characters']
    },
    category: {
        type: String,
        required: [true, 'Case category is required'],
        enum: ['Criminal', 'Civil', 'Family', 'Property', 'Corporate', 'Tax',
            'Labor', 'Consumer', 'Cyber', 'Constitutional', 'Other']
    },
    subcategory: { type: String, trim: true },
    location: {
        city: String,
        state: String,
        country: { type: String, default: 'India' }
    },
    urgencyLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    aiAnalysis: {
        classification: Object,
        suggestedCategory: String,
        urgencyScore: { type: Number, default: 50, min: 0, max: 100 },
        urgencyDetails: Object,
        riskScore: { type: Number, default: 50, min: 0, max: 100 },
        caseType: String,
        requiredSpecialization: [String],
        estimatedDuration: String,
        keyIssues: [String],
        recommendedActions: [String],
        reasoning: String,
        aiMatchScore: Number,
        embedding: [Number],
        note: String,
        analyzedAt: Date
    },
    status: {
        type: String,
        enum: ['submitted', 'analyzing', 'pending_advocate', 'pending_acceptance', 'assigned',
            'advocate_assigned', 'in_review', 'in_progress', 'on_hold', 'completed',
            'resolved', 'closed', 'withdrawn', 'cancelled'],
        default: 'submitted'
    },
    assignedAt: Date,
    completedAt: Date,
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    timeline: [{
        event: String,
        status: String,
        description: String,
        notes: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        date: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    outcome: {
        result: { type: String, enum: ['success', 'partial', 'failure', 'pending'] },
        description: String
    },
    nextHearingDate: Date,
    filingDate: Date,
    closedDate: Date,
    clientNotes: String,
    advocateNotes: { type: String, select: false },
    recommendedAdvocates: [{
        advocateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advocate' },
        matchScore: Number,
        reason: String,
        recommendedAt: { type: Date, default: Date.now }
    }],
    estimatedCost: Number,
    actualCost: Number,
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' }
}, { timestamps: true });

caseSchema.pre('save', async function (next) {
    if (!this.caseNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Case').countDocuments();
        this.caseNumber = `LSP-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

caseSchema.methods.addTimelineEvent = function (event, description, userId) {
    this.timeline.push({ event, description, date: new Date(), createdBy: userId });
    return this.save();
};

caseSchema.index({ clientId: 1 });
caseSchema.index({ advocateId: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ 'aiAnalysis.urgencyLevel': 1 });
caseSchema.index({ createdAt: -1 });

const Case = mongoose.model('Case', caseSchema);

export default Case;
