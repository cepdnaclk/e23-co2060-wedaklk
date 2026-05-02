import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkDuplicates() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobak');
  
  const db = mongoose.connection.db;
  
  const unverified = await db?.collection('unverified-users').find({}).toArray();
  const verified = await db?.collection('verified-users').find({}).toArray();
  
  console.log('--- Unverified Users ---');
  unverified?.forEach(u => console.log(`Email: ${u.email}, Phone: ${u.mobilePhone}, NIC: ${u.nicNumber}`));
  
  console.log('--- Verified Users ---');
  verified?.forEach(u => console.log(`Email: ${u.email}, Phone: ${u.mobilePhone}, NIC: ${u.nicNumber}`));
  
  process.exit(0);
}

checkDuplicates();
