import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true,
        index: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    advocateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Advocate',
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    categories: {
        communication: { type: Number, min: 1, max: 5 },
        expertise: { type: Number, min: 1, max: 5 },
        professionalism: { type: Number, min: 1, max: 5 },
        responseTime: { type: Number, min: 1, max: 5 },
        outcome: { type: Number, min: 1, max: 5 }
    },
    title: String,
    comment: {
        type: String,
        maxlength: 1000
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    advocateResponse: {
        comment: String,
        respondedAt: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    helpful: {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
}, {
    timestamps: true
});

// Ensure one review per case
reviewSchema.index({ caseId: 1 }, { unique: true });
reviewSchema.index({ advocateId: 1, rating: -1 });

// Update advocate rating after review
reviewSchema.post('save', async function () {
    const Review = this.constructor;
    const Advocate = mongoose.model('Advocate');

    const stats = await Review.aggregate([
        { $match: { advocateId: this.advocateId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
        await Advocate.findByIdAndUpdate(this.advocateId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].count
        });
    }
});

export default mongoose.model('Review', reviewSchema);
