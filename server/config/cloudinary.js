import cloudinaryPackage from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const cloudinary = cloudinaryPackage.v2;

// Validate Cloudinary credentials
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing Cloudinary environment variables:', missingVars);
  console.error('Please check your .env file');
} else {
  console.log('✅ Cloudinary environment variables are set');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true // Always use HTTPS
});

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    // Simple test to check if Cloudinary is configured
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.error('Check your Cloudinary credentials in the .env file');
  }
};

// Run test (optional)
testCloudinaryConnection();

export default cloudinary;