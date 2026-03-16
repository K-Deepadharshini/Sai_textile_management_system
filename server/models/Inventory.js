import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    itemCode: {
        type: String,
        required: true,
        unique: true
    },
    itemName: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['raw-material', 'finished-goods', 'consumables', 'chemicals'],
        required: true
    },
    category: {
        type: String,
        enum: ['polyester-chips', 'dyes', 'chemicals', 'packaging', 'yarn'],
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    currentStock: {
        type: Number,
        default: 0,
        min: 0
    },
    minStockLevel: {
        type: Number,
        default: 50
    },
    maxStockLevel: {
        type: Number,
        default: 1000
    },
    reorderPoint: {
        type: Number,
        default: 100
    },
    supplierDetails: {
        name: String,
        contact: String,
        email: String,
        leadTime: Number // in days
    },
    lastPurchase: {
        date: Date,
        quantity: Number,
        price: Number,
        supplier: String
    },
    averageCost: {
        type: Number,
        default: 0
    },
    location: {
        warehouse: String,
        rack: String,
        shelf: String
    },
    batchNumber: String,
    expiryDate: Date,
    status: {
        type: String,
        enum: ['in-stock', 'low-stock', 'out-of-stock', 'expired'],
        default: 'in-stock'
    },
    notes: String
}, {
    timestamps: true
});

// Update status based on stock level
inventorySchema.pre('save', function(next) {
    if (this.currentStock <= 0) {
        this.status = 'out-of-stock';
    } else if (this.currentStock <= this.minStockLevel) {
        this.status = 'low-stock';
    } else {
        this.status = 'in-stock';
    }
    
    if (this.expiryDate && new Date() > this.expiryDate) {
        this.status = 'expired';
    }
    
    next();
});

export default mongoose.model('Inventory', inventorySchema);