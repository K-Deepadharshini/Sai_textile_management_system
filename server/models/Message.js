import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    subject: String,
    message: {
        type: String,
        required: true
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    category: {
        type: String,
        enum: ['order-inquiry', 'payment', 'delivery', 'general', 'complaint', 'feedback'],
        default: 'general'
    }
}, {
    timestamps: true
});

// Mark as read when readAt is set
messageSchema.pre('save', function(next) {
    if (this.isRead && !this.readAt) {
        this.readAt = new Date();
    }
    next();
});

export default mongoose.model('Message', messageSchema);