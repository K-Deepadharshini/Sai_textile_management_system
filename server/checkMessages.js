import mongoose from 'mongoose';
import Message from './models/Message.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkMessages() {
  try {
    // Connect to database
    const mongoUri = process.env.MONO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sai-textile-management';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Database Connection: SUCCESS');
    console.log('Connected to database:', mongoose.connection.name);
    console.log('\n=== CHECKING MESSAGES DATABASE ===\n');

    // Get all users
    const users = await User.find({}, '_id name email role');
    console.log(`Total Users found: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`);
    });

    // Get admin users specifically
    const admins = await User.find({ role: 'admin' }, '_id name email role');
    console.log(`\nAdmin users found: ${admins.length}`);
    admins.forEach(a => {
      console.log(`  - ${a.name} (${a.email}) - ID: ${a._id}`);
    });

    // Get all messages
    const messages = await Message.find({})
      .populate('sender', '_id name email role')
      .populate('receiver', '_id name email role');
    
    console.log(`\nTotal Messages found: ${messages.length}`);
    messages.forEach(msg => {
      console.log(`  - From: ${msg.sender?.name} (${msg.sender?._id}), To: ${msg.receiver?.name} (${msg.receiver?._id}), Subject: ${msg.subject}`);
    });

    // Check messages received by admin
    if (admins.length > 0) {
      const adminId = admins[0]._id;
      const adminMessages = await Message.find({ receiver: adminId })
        .populate('sender', '_id name email role')
        .populate('receiver', '_id name email role');
      
      console.log(`\nMessages received by admin "${admins[0].name}" (ID: ${adminId}): ${adminMessages.length}`);
      adminMessages.forEach(msg => {
        console.log(`  - From: ${msg.sender?.name}, Subject: ${msg.subject}`);
      });
    }

    console.log('\n=== DIAGNOSTIC COMPLETE ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error checking messages:', error.message);
    process.exit(1);
  }
}

checkMessages();
