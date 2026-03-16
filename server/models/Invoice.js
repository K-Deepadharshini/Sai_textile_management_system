import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number,
        gstPercentage: Number,
        gstAmount: Number,
        total: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    gstAmount: {
        type: Number,
        required: true
    },
    shippingCharges: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    balanceDue: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially-paid', 'paid', 'overdue'],
        default: 'unpaid'
    },
    paymentTerms: String,
    paymentMethod: {
        type: String,
        enum: ['cash', 'cheque', 'bank-transfer', 'upi', 'credit-card']
    },
    paymentDetails: {
        transactionId: String,
        paymentDate: Date,
        bankName: String,
        chequeNumber: String,
        remarks: String
    },
    pdfUrl: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate invoice number before validation
invoiceSchema.pre('validate', function(next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const timestamp = Date.now().toString().slice(-8);
        this.invoiceNumber = `INV${year}${month}${timestamp}`;
        console.log('Generated invoice number (validate):', this.invoiceNumber);
    }
    next();
});

// Ensure invoice number is set before save
invoiceSchema.pre('save', function(next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const timestamp = Date.now().toString().slice(-8);
        this.invoiceNumber = `INV${year}${month}${timestamp}`;
        console.log('Generated invoice number (save):', this.invoiceNumber);
    }
    
    // Ensure all numeric values are present before saving
    if (this.amountPaid === undefined || this.amountPaid === null) this.amountPaid = 0;
    if (this.subtotal === undefined || this.subtotal === null) this.subtotal = 0;
    if (this.gstAmount === undefined || this.gstAmount === null) this.gstAmount = 0;
    if (this.grandTotal === undefined || this.grandTotal === null) this.grandTotal = 0;
    
    // Calculate balance due
    this.balanceDue = this.grandTotal - this.amountPaid;
    
    // Update payment status based on payment
    if (this.amountPaid >= this.grandTotal) {
        this.paymentStatus = 'paid';
    } else if (this.amountPaid > 0) {
        this.paymentStatus = 'partially-paid';
    } else if (new Date() > this.dueDate) {
        this.paymentStatus = 'overdue';
    } else {
        this.paymentStatus = this.paymentStatus || 'unpaid';
    }
    
    next();
});

export default mongoose.model('Invoice', invoiceSchema);