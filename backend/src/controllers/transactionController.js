const Transaction = require('../models/Transaction');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { type, status, category, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { senderId: req.user._id },
        { receiverId: req.user._id }
      ]
    };

    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    sendSuccess(res, {
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    if (!txn) {
      return sendError(res, 'Transaction not found', 404);
    }

    // make sure user can only see their own transactions
    const userId = req.user._id.toString();
    const isOwner = (txn.senderId && txn.senderId._id.toString() === userId) ||
                    (txn.receiverId && txn.receiverId._id.toString() === userId);

    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this transaction', 403);
    }

    sendSuccess(res, { transaction: txn });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id/receipt
const getTransactionReceipt = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    if (!txn) return sendError(res, 'Transaction not found', 404);

    const userId = req.user._id.toString();
    const isOwner = (txn.senderId && txn.senderId._id.toString() === userId) ||
                    (txn.receiverId && txn.receiverId._id.toString() === userId);

    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized', 403);
    }

    const receipt = {
      transactionId: txn.transactionId,
      type: txn.type,
      amount: txn.amount,
      status: txn.status,
      sender: txn.senderId ? { name: txn.senderId.name, email: txn.senderId.email } : null,
      receiver: txn.receiverId ? { name: txn.receiverId.name, email: txn.receiverId.email } : null,
      description: txn.description,
      category: txn.category,
      date: txn.createdAt,
      suspiciousFlag: txn.suspiciousFlag
    };

    sendSuccess(res, { receipt });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/summary/monthly
const getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const summary = await Transaction.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
          status: { $in: ['successful', 'flagged'] }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, getTransactionById, getTransactionReceipt, getMonthlySummary };
