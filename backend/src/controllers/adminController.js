const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const createNotification = require('../utils/createNotification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });
    const blockedUsers = await User.countDocuments({ status: 'blocked' });
    const totalTransactions = await Transaction.countDocuments();
    const flaggedTransactions = await Transaction.countDocuments({ suspiciousFlag: true });

    const volumeAgg = await Transaction.aggregate([
      { $match: { status: { $in: ['successful', 'flagged'] } } },
      { $group: { _id: null, totalVolume: { $sum: '$amount' } } }
    ]);

    const totalBalance = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    sendSuccess(res, {
      totalUsers,
      activeUsers,
      blockedUsers,
      totalTransactions,
      flaggedTransactions,
      transactionVolume: volumeAgg[0]?.totalVolume || 0,
      systemBalance: totalBalance[0]?.total || 0
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    sendSuccess(res, { users, pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    const wallet = await Wallet.findOne({ userId: user._id });
    const txnCount = await Transaction.countDocuments({
      $or: [{ senderId: user._id }, { receiverId: user._id }]
    });

    sendSuccess(res, { user, wallet, transactionCount: txnCount });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/block
const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    if (user.role === 'admin') return sendError(res, 'Cannot block an admin', 400);

    user.status = 'blocked';
    await user.save();

    await createNotification(user._id, 'Account Blocked', 'Your account has been blocked by admin. Contact support for help.', 'account');

    // audit log
    await AuditLog.create({
      actorId: req.user._id,
      action: 'BLOCK_USER',
      targetType: 'user',
      targetId: user._id,
      details: { userName: user.name },
      ipAddress: req.ip
    });

    sendSuccess(res, { user }, 'User blocked');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/unblock
const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    user.status = 'active';
    await user.save();

    await createNotification(user._id, 'Account Unblocked', 'Your account has been reactivated by admin.', 'account');

    await AuditLog.create({
      actorId: req.user._id,
      action: 'UNBLOCK_USER',
      targetType: 'user',
      targetId: user._id,
      details: { userName: user.name },
      ipAddress: req.ip
    });

    sendSuccess(res, { user }, 'User unblocked');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/wallets
const getAllWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.find().populate('userId', 'name email status');
    sendSuccess(res, { wallets });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/transactions
const getAllTransactions = async (req, res, next) => {
  try {
    const { type, status, startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    sendSuccess(res, { transactions, pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/transactions/flagged
const getFlaggedTransactions = async (req, res, next) => {
  try {
    const flagged = await Transaction.find({ suspiciousFlag: true })
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    sendSuccess(res, { transactions: flagged });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/transaction-volume
const getTransactionVolume = async (req, res, next) => {
  try {
    const volume = await Transaction.aggregate([
      { $match: { status: { $in: ['successful', 'flagged'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);
    sendSuccess(res, { volume });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reports/system-balance
const getSystemBalance = async (req, res, next) => {
  try {
    const result = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } }
    ]);
    sendSuccess(res, { totalBalance: result[0]?.total || 0, walletCount: result[0]?.count || 0 });
  } catch (err) {
    next(err);
  }
};

// --- Category management ---

// POST /api/admin/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    const category = await Category.create({ name, type, description, createdBy: req.user._id });
    sendSuccess(res, { category }, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/categories (also available at /api/categories for all users)
const getCategories = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { isActive: true };
    const categories = await Category.find(query).sort({ name: 1 });
    sendSuccess(res, { categories });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return sendError(res, 'Category not found', 404);
    sendSuccess(res, { category }, 'Category updated');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/categories/:id/disable
const disableCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!category) return sendError(res, 'Category not found', 404);
    sendSuccess(res, { category }, 'Category disabled');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actorId', 'name email');
    sendSuccess(res, { logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard, getAllUsers, getUserById, blockUser, unblockUser,
  getAllWallets, getAllTransactions, getFlaggedTransactions,
  getTransactionVolume, getSystemBalance,
  createCategory, getCategories, updateCategory, disableCategory,
  getAuditLogs
};
