const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorHandler');

// route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://web-project-lime-alpha.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FinVault API is running', timestamp: new Date() });
});

// one-time seed route
app.get('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const Wallet = require('./models/Wallet');
    const Category = require('./models/Category');
    const existing = await User.findOne({ email: 'admin@finvault.com' });
    if (existing) return res.json({ message: 'Admin already exists' });
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@finvault.com',
      password: 'admin123',
      cnic: '0000000000000',
      role: 'admin'
    });
    await Wallet.create({ userId: admin._id });
    const cats = ['Food','Transport','Shopping','Health','Education','Entertainment','Utilities','Other'];
    for (const name of cats) {
      await Category.findOneAndUpdate({ name }, { name, isActive: true }, { upsert: true });
    }
    res.json({ message: 'Seeded successfully', email: 'admin@finvault.com', password: 'admin123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// error handler
app.use(errorHandler);

module.exports = app;
