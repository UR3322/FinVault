const express = require('express');
const router = express.Router();
const { createBudget, getBudgets, getCurrentBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const { budgetValidation } = require('../validations/budgetValidation');
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.post('/', protect, budgetValidation, validateRequest, createBudget);
router.get('/', protect, getBudgets);
router.get('/current', protect, getCurrentBudget);
router.put('/:id', protect, validateObjectId, budgetValidation, validateRequest, updateBudget);
router.delete('/:id', protect, validateObjectId, deleteBudget);

module.exports = router;
