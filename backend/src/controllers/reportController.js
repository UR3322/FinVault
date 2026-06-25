const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const Wallet = require('../models/Wallet');
const Budget = require('../models/Budget');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/reports/user-dashboard
const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ userId });

    // recent transactions
    const recentTxns = await Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 }).limit(5);

    // this month's spending
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlyExpenses = await Expense.aggregate([
      { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budget = await Budget.findOne({ userId, month: currentMonth });

    // transaction counts
    const txnCounts = await Transaction.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }], status: 'successful' } },
      { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    sendSuccess(res, {
      balance: wallet?.balance || 0,
      recentTransactions: recentTxns,
      monthlyExpenses: monthlyExpenses[0] || { total: 0, count: 0 },
      budget: budget || null,
      transactionBreakdown: txnCounts
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/income-expense
const getIncomeExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // income = deposits + transfers in
    const income = await Transaction.aggregate([
      {
        $match: {
          receiverId: userId,
          type: { $in: ['deposit', 'transfer'] },
          status: { $in: ['successful', 'flagged'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // expense = withdrawals + transfers out + expenses
    const outgoing = await Transaction.aggregate([
      {
        $match: {
          senderId: userId,
          type: { $in: ['withdrawal', 'transfer'] },
          status: { $in: ['successful', 'flagged'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    sendSuccess(res, { income, outgoing });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/budget-usage
const getBudgetUsage = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id })
      .sort({ month: -1 })
      .limit(6);

    const usage = budgets.map(b => ({
      month: b.month,
      limit: b.totalLimit,
      spent: b.spentAmount,
      status: b.status,
      percentage: b.totalLimit > 0 ? Math.round((b.spentAmount / b.totalLimit) * 100) : 0
    }));

    sendSuccess(res, { usage });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserDashboard, getIncomeExpense, getBudgetUsage };
