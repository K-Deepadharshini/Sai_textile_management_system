import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function addTestModel3D() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sai-textile-management';
    console.log('Connecting to:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Database Connection: SUCCESS\n');

    // Find the first available product
    const product = await Product.findOne({ status: 'available' });

    if (!product) {
      console.log('No available products found');
      return;
    }

    console.log('Found product:', product.name, '-', product.productCode);

    // Add test 3D model data from .env variable (avoid Cloudinary demo placeholder)
    const testModelUrl = process.env.TEST_MODEL_3D_URL;
    if (!testModelUrl) {
      throw new Error('Missing TEST_MODEL_3D_URL in .env. Set it to a valid Cloudinary raw resource URL.');
    }

    product.model3D = {
      url: testModelUrl,
      publicId: process.env.TEST_MODEL_3D_PUBLIC_ID || 'sample-model-123',
      fileName: process.env.TEST_MODEL_3D_FILE_NAME || 'sample.fbx'
    };

    await product.save();

    console.log('✅ Successfully added test 3D model to product:', product.name);
    console.log('Model3D data:', product.model3D);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
}

addTestModel3D();