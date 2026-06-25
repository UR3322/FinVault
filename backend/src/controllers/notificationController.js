const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, readStatus: false });

    sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return sendError(res, 'Notification not found', 404);

    if (notification.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized', 403);
    }

    notification.readStatus = true;
    await notification.save();

    sendSuccess(res, { notification }, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readStatus: false },
      { readStatus: true }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead };
