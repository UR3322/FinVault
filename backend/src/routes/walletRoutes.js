const express = require('express');
const router = express.Router();
const { getWallet, getWalletSummary, deposit, withdraw, transfer } = require('../controllers/walletController');
const { depositValidation, withdrawValidation, transferValidation } = require('../validations/walletValidation');
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/auth');
const checkBlocked = require('../middlewares/checkBlocked');
const { walletLimiter } = require('../middlewares/rateLimiter');

router.get('/', protect, getWallet);
router.get('/summary', protect, getWalletSummary);
router.post('/deposit', protect, checkBlocked, walletLimiter, depositValidation, validateRequest, deposit);
router.post('/withdraw', protect, checkBlocked, walletLimiter, withdrawValidation, validateRequest, withdraw);
router.post('/transfer', protect, checkBlocked, walletLimiter, transferValidation, validateRequest, transfer);

module.exports = router;
