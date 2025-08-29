const mongoose = require('mongoose');

// Test connection to MongoDB Atlas
async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB Atlas connection...');
    
    // Try to connect
    await mongoose.connect('mongodb+srv://dorsatwararnesh:B8TZtheWEC2FZu6D@cluster1.fnau2wu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1');
    
    console.log('✅ Connection successful!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🔌 Connection state:', mongoose.connection.readyState);
    
    // List databases
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log('\n📚 Available databases:');
    dbList.databases.forEach(db => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
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
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
    process.exit(0);
  }
}

testConnection();
