// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');

// Test connection to MongoDB Atlas
async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB Atlas connection...');
    
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file or environment.');
    }
    try {
      const adminDb = mongoose.connection.db.admin();
      const dbList = await adminDb.listDatabases();
      console.log('\n📚 Available databases:');
      for (const db of dbList.databases) {
        console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
      }
    } catch (authErr) {
      if (authErr?.code === 13 || /not authorized/i.test(authErr.message)) {
        console.log('\nℹ️ Connected, but user lacks listDatabases privilege. Skipping database list.');
      } else {
        console.warn('\n⚠️ Failed to list databases:', authErr.message);
      }
    }    console.log('🔌 Connection state:', mongoose.connection.readyState);
    
    // List databases
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log('\n📚 Available databases:');
    dbList.databases.forEach(db => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exitCode = 1;
    
    if (error.message.includes('bad auth')) {
      console.log('\n🔑 Authentication failed. Possible issues:');
      console.log('  1. Wrong username or password');
      console.log('  2. User not created in MongoDB Atlas');
      console.log('  3. User permissions not set correctly');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 Network issue. Possible causes:');
      console.log('  1. Cluster name is wrong');
      console.log('  2. Network access not configured');
      console.log('  3. Firewall blocking connection');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Connection closed');
    }
  }
}

testConnection();
