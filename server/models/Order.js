import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    gstPercentage: {
        type: Number,
        default: 18
    },
    totalPrice: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    gstAmount: {
        type: Number,
        required: true
    },
    grandTotal: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },
    billingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-production', 'quality-check', 'ready-for-dispatch', 'dispatched', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partially-paid', 'paid', 'overdue'],
        default: 'pending'
    },
    paymentTerms: {
        type: String,
        enum: ['advance', 'net-7', 'net-15', 'net-30'],
        default: 'net-15'
    },
    paymentDueDate: Date,
    productionBatches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductionBatch'
    }],
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD${year}${month}${(count + 1).toString().padStart(5, '0')}`;
    }
    
    // Calculate totals
    let totalAmount = 0;
    this.items.forEach(item => {
        item.totalPrice = item.quantity * item.unitPrice;
        totalAmount += item.totalPrice;
    });
    
    this.totalAmount = totalAmount;
    this.gstAmount = (totalAmount * (this.items[0]?.gstPercentage || 18)) / 100;
    this.grandTotal = totalAmount + this.gstAmount;
    
    // Set payment due date
    if (!this.paymentDueDate && this.orderDate) {
        const dueDays = this.paymentTerms === 'net-7' ? 7 : 
                       this.paymentTerms === 'net-15' ? 15 : 
                       this.paymentTerms === 'net-30' ? 30 : 0;
        this.paymentDueDate = new Date(this.orderDate);
        this.paymentDueDate.setDate(this.paymentDueDate.getDate() + dueDays);
    }
    
    next();
});

export default mongoose.model('Order', orderSchema);