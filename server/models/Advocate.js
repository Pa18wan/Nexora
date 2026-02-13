import mongoose from 'mongoose';

const advocateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    barCouncilId: {
        type: String,
        required: [true, 'Bar Council ID is required'],
        trim: true
    },
    specialization: [{
        type: String,
        enum: [
            'Criminal Law', 'Civil Law', 'Family Law', 'Property Law', 'Corporate Law',
            'Tax Law', 'Labor Law', 'Intellectual Property', 'Constitutional Law',
            'Consumer Law', 'Cyber Law', 'Immigration Law', 'Environmental Law',
            'Human Rights', 'Banking Law', 'Insurance Law', 'Medical Law',
            'Entertainment Law', 'Sports Law', 'General Practice'
        ]
    }],
    experienceYears: {
        type: Number,
        required: [true, 'Experience is required'],
        min: [0, 'Experience cannot be negative']
    },
    education: [{
        degree: String,
        institution: String,
        year: Number
    }],
    certifications: [{
        name: String,
        issuedBy: String,
        year: Number
    }],
    courtsPracticed: [{
        type: String,
        enum: ['Supreme Court', 'High Court', 'District Court', 'Sessions Court',
            'Magistrate Court', 'Family Court', 'Consumer Forum', 'Labor Court', 'Tribunal']
    }],
    languages: [{ type: String }],
    successRate: { type: Number, default: 0, min: 0, max: 100 },
    totalCases: { type: Number, default: 0 },
    casesWon: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    availability: {
        monday: { start: String, end: String, available: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
        thursday: { start: String, end: String, available: { type: Boolean, default: true } },
        friday: { start: String, end: String, available: { type: Boolean, default: true } },
        saturday: { start: String, end: String, available: { type: Boolean, default: false } },
        sunday: { start: String, end: String, available: { type: Boolean, default: false } }
    },
    officeAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    isProfileComplete: { type: Boolean, default: false },
    isAcceptingCases: { type: Boolean, default: true },
    bio: { type: String, maxlength: 1000 }
}, { timestamps: true });

advocateSchema.methods.updateSuccessRate = function () {
    if (this.totalCases > 0) {
        this.successRate = Math.round((this.casesWon / this.totalCases) * 100);
    }
    return this.successRate;
};

advocateSchema.index({ userId: 1 });
advocateSchema.index({ specialization: 1 });
advocateSchema.index({ rating: -1 });
advocateSchema.index({ verificationStatus: 1 });

const Advocate = mongoose.model('Advocate', advocateSchema);

export default Advocate;
