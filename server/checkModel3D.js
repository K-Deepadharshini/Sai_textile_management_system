import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkModel3D() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sai-textile-management';
    console.log('Connecting to database...');

    await mongoose.connect(mongoUri);

    console.log('Connected to database\n');

    // Get all products
    const products = await Product.find({}).select('name productCode model3D status stockQuantity');

    console.log(`Found ${products.length} products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.productCode}):`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Stock: ${product.stockQuantity}`);
      console.log(`   model3D:`, JSON.stringify(product.model3D, null, 2));

      if (product.model3D && product.model3D.url) {
        console.log(`   ✅ Has 3D model: ${product.model3D.fileName}`);
      } else {
        console.log(`   ❌ No 3D model`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
}

checkModel3D();