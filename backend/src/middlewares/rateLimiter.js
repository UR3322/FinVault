const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many attempts, please try again after 15 minutes',
    data: null
  }
});

const walletLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many transactions, slow down',
    data: null
  }
});

module.exports = { authLimiter, walletLimiter };
