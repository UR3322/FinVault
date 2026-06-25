const express = require('express');
const router = express.Router();
const { getCategories } = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');

// public category listing for all logged-in users
router.get('/', protect, getCategories);

module.exports = router;
