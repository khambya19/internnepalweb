const { Notification } = require('../models');

/** Create a notification (use from other controllers or services) */
async function createNotification({ userId, type = 'info', title, message = null, link = null }) {
  if (!userId || !title) return null;
  try {
    return await Notification.create({
      userId,
      type,
      title,
      message,
      link,
    });
  } catch (err) {
    console.error('createNotification error:', err.message);
    return null;
  }
}

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
    const unreadOnly = req.query.unread === 'true';

    const where = { userId: req.user.id };
    if (unreadOnly) where.read = false;

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, read: false },
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Mark one notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOne({
      where: { id, userId: req.user.id },
    });
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notif.read = true;
    await notif.save();
    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );
    res.status(200).json({ success: true, message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createNotification = createNotification;
