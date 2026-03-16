import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    productCode: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['polyester-filament', 'yarn-dyed', 'raw-yarn'],
        required: true
    },
    denier: {
        type: String,
        required: true
    },
    shade: {
        colorCode: String,
        colorName: String,
        hexCode: String
    },
    specifications: {
        twist: String,
        luster: String,
        tenacity: String,
        elongation: String
    },
    moq: {
        type: Number,
        required: true,
        min: 1
    },
    unit: {
        type: String,
        enum: ['kg', 'meter', 'yard'],
        default: 'kg'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    gstPercentage: {
        type: Number,
        default: 18
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    minStockLevel: {
        type: Number,
        default: 100
    },
    maxStockLevel: {
        type: Number,
        default: 10000
    },
    status: {
        type: String,
        enum: ['available', 'out-of-stock', 'discontinued'],
        default: 'available'
    },
    images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
    description: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Product', productSchema);