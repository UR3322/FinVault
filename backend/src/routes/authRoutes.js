const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validations/authValidation');
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, registerValidation, validateRequest, register);
router.post('/login', authLimiter, loginValidation, validateRequest, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
