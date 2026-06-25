const express = require('express');
const router = express.Router();
const { createExpense, getExpenses, getMonthlySummary, getCategorySummary, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { expenseValidation } = require('../validations/expenseValidation');
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.post('/', protect, expenseValidation, validateRequest, createExpense);
router.get('/', protect, getExpenses);
router.get('/summary/monthly', protect, getMonthlySummary);
router.get('/summary/categories', protect, getCategorySummary);
router.put('/:id', protect, validateObjectId, expenseValidation, validateRequest, updateExpense);
router.delete('/:id', protect, validateObjectId, deleteExpense);

module.exports = router;
