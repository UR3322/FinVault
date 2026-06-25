const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { updateProfileValidation, changePasswordValidation } = require('../validations/userValidation');
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, validateRequest, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validateRequest, changePassword);

module.exports = router;
