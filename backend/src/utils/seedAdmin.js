const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const connectDB = require('../config/db');

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: 'admin@finvault.com' });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@finvault.com',
    password: 'admin123',
    role: 'admin'
  });

  await Wallet.create({ userId: admin._id });

  console.log('Admin account created');
  console.log('Email: admin@finvault.com');
  console.log('Password: admin123');
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
