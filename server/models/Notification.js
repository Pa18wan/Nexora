import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['case_update', 'document_uploaded', 'advocate_assigned', 'hearing_reminder',
            'payment_due', 'message_received', 'case_resolved', 'urgent_alert',
            'system', 'ai_recommendation'],
        required: true
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    relatedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
    relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    actionUrl: { type: String },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    isRead: { type: Boolean, default: false },
    readAt: Date
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
