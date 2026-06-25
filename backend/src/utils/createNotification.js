const Notification = require('../models/Notification');

async function createNotification(userId, title, message, type = 'system', relatedTransactionId = null) {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      relatedTransactionId
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = createNotification;
