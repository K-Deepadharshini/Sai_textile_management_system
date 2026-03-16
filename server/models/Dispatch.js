import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema({
    dispatchNumber: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dispatchDate: {
        type: Date,
        default: Date.now
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
        batchNumbers: [String],
        packagingType: String
    }],
    totalWeight: Number,
    totalPackages: Number,
    transportDetails: {
        transporter: String,
        vehicleNumber: String,
        driverName: String,
        driverContact: String,
        lrNumber: String,
        trackingNumber: String
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String,
        contactPerson: String,
        contactNumber: String
    },
    documents: [{
        documentType: String,
        documentUrl: String,
        uploadedAt: Date
    }],
    status: {
        type: String,
        enum: ['ready', 'dispatched', 'in-transit', 'delivered', 'delayed', 'cancelled'],
        default: 'ready'
    },
    deliveryProof: {
        receivedBy: String,
        signatureUrl: String,
        deliveryNotes: String,
        deliveredAt: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate dispatch number
dispatchSchema.pre('save', async function(next) {
    if (!this.dispatchNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await this.constructor.countDocuments();
        this.dispatchNumber = `DISP${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

export default mongoose.model('Dispatch', dispatchSchema);