const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /api/notifications
 * @desc Get authenticated user's notifications
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const notifications = await db.allAsync(
      `SELECT * FROM notifications 
       WHERE recipient_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    const unreadCount = await db.getAsync(
      `SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND is_read = 0`,
      [req.user.id]
    );

    res.json({
      success: true,
      unreadCount: unreadCount ? unreadCount.count : 0,
      notifications
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/notifications/unread-count
 * @desc Quick badge count for header bell icon
 */
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const row = await db.getAsync(
      `SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND is_read = 0`,
      [req.user.id]
    );
    res.json({ success: true, count: row ? row.count : 0 });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark single notification as read
 */
router.patch('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    await db.runAsync(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/notifications/read-all
 * @desc Mark all notifications as read for current user
 */
router.patch('/read-all', authenticateToken, async (req, res, next) => {
  try {
    await db.runAsync(
      `UPDATE notifications SET is_read = 1 WHERE recipient_id = ?`,
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
