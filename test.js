// scripts/addAdmin.js (ES Module version)
// Run this script with: node addAdmin.js

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// MongoDB connection URI - Replace with your actual URI or use environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lkwedak_db_user:105JOOxypA25LGZm@cluster0.18dgmaz.mongodb.net/';

async function addAdmin() {
  let client;
  
  try {
    console.log('🔐 Admin User Creation Script\n');
    
    // Get admin details from user
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    const name = await question('Enter admin name (optional): ');
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      rl.close();
      return;
    }
    
    // Validate password
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      rl.close();
      return;
    }
    
    console.log('\n🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(); // Uses database from URI
    const adminsCollection = db.collection('admins');
    
    // Check if admin with this email already exists
    const existingAdmin = await adminsCollection.findOne({ email: email.toLowerCase() });
    
    if (existingAdmin) {
      console.error(`❌ Admin with email ${email} already exists`);
      rl.close();
      await client.close();
      return;
    }
    
    console.log('🔒 Hashing password...');
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create admin object
    const adminUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };
    
    console.log('💾 Inserting admin into database...');
    
    // Insert admin into database
    const result = await adminsCollection.insertOne(adminUser);
    
    console.log('\n✅ Admin user created successfully!');
    console.log('\nAdmin Details:');
    console.log('─────────────────────────────────');
    console.log(`ID: ${result.insertedId}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Created: ${adminUser.createdAt.toISOString()}`);
    console.log('─────────────────────────────────\n');
    
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    
    if (error.code === 8000) {
      console.error('\n💡 Tips:');
      console.error('  - Check your username and password');
      console.error('  - Ensure special characters in password are URL-encoded');
      console.error('  - Verify IP whitelist in MongoDB Atlas');
    }
  } finally {
    rl.close();
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the script
addAdmin();

/* 
═══════════════════════════════════════════════════════════════════
SETUP INSTRUCTIONS (ES MODULE VERSION):
═══════════════════════════════════════════════════════════════════

1. Install required packages:
   npm install mongodb bcryptjs

2. Create a .env file in your project root with:
   MONGODB_URI=your_mongodb_connection_string

3. Save this file as: addAdmin.js (in your project root)

4. Run the script:
   node addAdmin.js

5. OR add to package.json scripts:
   "scripts": {
     "add-admin": "node addAdmin.js"
   }
   
   Then run: npm run add-admin

═══════════════════════════════════════════════════════════════════
ALTERNATIVE: Use CommonJS version
═══════════════════════════════════════════════════════════════════

If you prefer CommonJS, rename the file to: addAdmin.cjs
Then the require() syntax will work.

═══════════════════════════════════════════════════════════════════
*/