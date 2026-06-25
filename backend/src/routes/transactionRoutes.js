const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionById, getTransactionReceipt, getMonthlySummary } = require('../controllers/transactionController');
const { protect } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.get('/', protect, getTransactions);
router.get('/summary/monthly', protect, getMonthlySummary);
router.get('/:id', protect, validateObjectId, getTransactionById);
router.get('/:id/receipt', protect, validateObjectId, getTransactionReceipt);

module.exports = router;
