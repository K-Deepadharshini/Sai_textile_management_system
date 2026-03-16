import mongoose from 'mongoose';

const productionBatchSchema = new mongoose.Schema({
    batchNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rawMaterialUsed: [{
        material: String,
        quantity: Number,
        unit: String
    }],
    quantityProduced: {
        type: Number,
        required: true,
        min: 1
    },
    unit: {
        type: String,
        default: 'kg'
    },
    machineDetails: {
        machineId: String,
        machineName: String,
        operator: String
    },
    dyeingDetails: {
        dyeLot: String,
        shade: String,
        dyeQuantity: Number,
        dyeUnit: String,
        dyeingDate: Date
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'quality-check', 'dispatched'],
        default: 'planned'
    },
    wastage: {
        type: Number,
        default: 0
    },
    wastagePercentage: {
        type: Number,
        default: 0
    },
    qualityCheck: {
        checkedBy: String,
        checkDate: Date,
        result: {
            type: String,
            enum: ['passed', 'failed', 'rework'],
            default: 'passed'
        },
        remarks: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate batch number before saving
productionBatchSchema.pre('save', async function(next) {
    if (!this.batchNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await this.constructor.countDocuments();
        this.batchNumber = `BATCH${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

export default mongoose.model('ProductionBatch', productionBatchSchema);