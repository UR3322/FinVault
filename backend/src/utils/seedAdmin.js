const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const connectDB = require('../config/db');

// Default categories created on every fresh setup
const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Health',
  'Education', 'Entertainment', 'Utilities', 'Other'
];

async function seedAdmin() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@finvault.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists, skipping.');
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin',
    email,
    password,
    role: 'admin'
  });

  await Wallet.create({ userId: admin._id });

  for (const name of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate({ name }, { name, isActive: true }, { upsert: true });
  }

  console.log('Admin account created');
  console.log(`Email: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('WARNING: using the default seed password. Set ADMIN_PASSWORD in your .env and re-seed, or change it after first login.');
  }
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
