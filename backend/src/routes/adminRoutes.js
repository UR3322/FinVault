const express = require('express');
const router = express.Router();
const {
  getDashboard, getAllUsers, getUserById, blockUser, unblockUser,
  getAllWallets, getAllTransactions, getFlaggedTransactions,
  getTransactionVolume, getSystemBalance,
  createCategory, getCategories, updateCategory, disableCategory,
  getAuditLogs
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

// all routes require admin
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.get('/users/:id', validateObjectId, getUserById);
router.patch('/users/:id/block', validateObjectId, blockUser);
router.patch('/users/:id/unblock', validateObjectId, unblockUser);
router.get('/wallets', getAllWallets);
router.get('/transactions', getAllTransactions);
router.get('/transactions/flagged', getFlaggedTransactions);
router.get('/reports/transaction-volume', getTransactionVolume);
router.get('/reports/system-balance', getSystemBalance);
router.post('/categories', createCategory);
router.get('/categories', getCategories);
router.put('/categories/:id', validateObjectId, updateCategory);
router.patch('/categories/:id/disable', validateObjectId, disableCategory);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
