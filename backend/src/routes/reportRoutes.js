const express = require('express');
const router = express.Router();
const { getUserDashboard, getIncomeExpense, getBudgetUsage } = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

router.get('/user-dashboard', protect, getUserDashboard);
router.get('/income-expense', protect, getIncomeExpense);
router.get('/budget-usage', protect, getBudgetUsage);

module.exports = router;
