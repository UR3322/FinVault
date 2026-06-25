const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { calculateBudgetStatus } = require('../utils/budgetHelper');
const createNotification = require('../utils/createNotification');

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, paymentMethod, date, notes } = req.body;

    const expense = await Expense.create({
      userId: req.user._id,
      title,
      amount: parseFloat(amount),
      category,
      paymentMethod: paymentMethod || 'wallet',
      date,
      notes
    });

    // check if this expense pushes any budget over the limit
    const monthStr = new Date(date).toISOString().slice(0, 7);
    const budget = await Budget.findOne({ userId: req.user._id, month: monthStr });

    if (budget) {
      const totalSpent = await Expense.aggregate([
        { $match: { userId: req.user._id, date: { $gte: new Date(monthStr + '-01'), $lt: new Date(new Date(monthStr + '-01').setMonth(new Date(monthStr + '-01').getMonth() + 1)) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spent = totalSpent[0]?.total || 0;
      const newStatus = calculateBudgetStatus(spent, budget.totalLimit, budget.warningThreshold);

      if (newStatus !== budget.status) {
        budget.spentAmount = spent;
        budget.status = newStatus;
        await budget.save();

        if (newStatus === 'nearLimit') {
          await createNotification(req.user._id, 'Budget Warning', `Your budget for ${monthStr} is near the limit (${Math.round(spent / budget.totalLimit * 100)}% used)`, 'budget');
        } else if (newStatus === 'exceeded') {
          await createNotification(req.user._id, 'Budget Exceeded', `Your budget for ${monthStr} has been exceeded!`, 'budget');
        }
      }
    }

    sendSuccess(res, { expense }, 'Expense created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { userId: req.user._id };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    sendSuccess(res, {
      expenses,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/expenses/summary/monthly
const getMonthlySummary = async (req, res, next) => {
  try {
    const summary = await Expense.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
};

// GET /api/expenses/summary/categories
const getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Expense.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return sendError(res, 'Expense not found', 404);

    if (expense.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized to edit this expense', 403);
    }

    const { title, amount, category, paymentMethod, date, notes } = req.body;
    if (title) expense.title = title;
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();
    sendSuccess(res, { expense }, 'Expense updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return sendError(res, 'Expense not found', 404);

    if (expense.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized to delete this expense', 403);
    }

    await expense.deleteOne();
    sendSuccess(res, null, 'Expense deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { createExpense, getExpenses, getMonthlySummary, getCategorySummary, updateExpense, deleteExpense };
