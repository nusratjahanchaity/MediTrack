const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// All notification routes require auth
router.use(authMiddleware);

// GET /api/notifications
// Retrieves unread notifications for the current logged-in user
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Server error retrieving notifications' });
  }
});

// PATCH /api/notifications/:id/read
// Marks a specific notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error.message);
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// PATCH /api/notifications/read-all
// Marks all notifications for current user as read
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.uid, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error.message);
    res.status(500).json({ message: 'Server error clearing notifications' });
  }
});

module.exports = router;
