const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, validateObjectId, markAsRead);

module.exports = router;
