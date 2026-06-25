const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { calculateBudgetStatus } = require('../utils/budgetHelper');

// POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const { month, totalLimit, categoryLimits, warningThreshold } = req.body;

    const existing = await Budget.findOne({ userId: req.user._id, month });
    if (existing) {
      return sendError(res, 'Budget already exists for this month', 400);
    }

    const budget = await Budget.create({
      userId: req.user._id,
      month,
      totalLimit,
      categoryLimits: categoryLimits || [],
      warningThreshold: warningThreshold || 75
    });

    sendSuccess(res, { budget }, 'Budget created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id }).sort({ month: -1 });

    // recalculate spent amounts and status for each budget
    const enriched = await Promise.all(budgets.map(async (b) => {
      const monthStart = new Date(b.month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const agg = await Expense.aggregate([
        { $match: { userId: req.user._id, date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spent = agg[0]?.total || 0;
      const status = calculateBudgetStatus(spent, b.totalLimit, b.warningThreshold);

      // update if changed
      if (b.spentAmount !== spent || b.status !== status) {
        b.spentAmount = spent;
        b.status = status;
        await b.save();
      }

      return b;
    }));

    sendSuccess(res, { budgets: enriched });
  } catch (err) {
    next(err);
  }
};

// GET /api/budgets/current
const getCurrentBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let budget = await Budget.findOne({ userId: req.user._id, month: currentMonth });

    if (!budget) {
      return sendSuccess(res, { budget: null }, 'No budget set for current month');
    }

    // recalculate
    const monthStart = new Date(currentMonth + '-01');
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const agg = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const spent = agg[0]?.total || 0;
    budget.spentAmount = spent;
    budget.status = calculateBudgetStatus(spent, budget.totalLimit, budget.warningThreshold);
    await budget.save();

    // category breakdown
    const categorySpending = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: monthStart, $lt: monthEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    sendSuccess(res, { budget, categorySpending });
  } catch (err) {
    next(err);
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return sendError(res, 'Budget not found', 404);

    if (budget.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized', 403);
    }

    const { totalLimit, categoryLimits, warningThreshold } = req.body;
    if (totalLimit) budget.totalLimit = totalLimit;
    if (categoryLimits) budget.categoryLimits = categoryLimits;
    if (warningThreshold) budget.warningThreshold = warningThreshold;

    await budget.save();
    sendSuccess(res, { budget }, 'Budget updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return sendError(res, 'Budget not found', 404);

    if (budget.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized', 403);
    }

    await budget.deleteOne();
    sendSuccess(res, null, 'Budget deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { createBudget, getBudgets, getCurrentBudget, updateBudget, deleteBudget };
