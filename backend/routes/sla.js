const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/sla
 * @desc Get SLA configurations and overdue status list
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'staff'), async (req, res, next) => {
  try {
    const slas = await db.allAsync(`SELECT * FROM sla_configurations ORDER BY target_hours ASC`);

    // Find all complaints exceeding SLA deadline
    const overdueComplaints = await db.allAsync(`
      SELECT c.id, c.reference_no, c.title, c.priority, c.status, c.sla_deadline, c.created_at,
             cat.name AS category_name,
             u.full_name AS complainant_name,
             staff.full_name AS staff_name
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE c.status NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')
        AND c.sla_deadline IS NOT NULL
        AND datetime(c.sla_deadline) < datetime('now')
      ORDER BY c.sla_deadline ASC
    `);

    res.json({
      success: true,
      slas,
      overdueCount: overdueComplaints.length,
      overdueComplaints
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/sla/:priority
 * @desc Update SLA target hours for a priority level (Admin only)
 */
router.put('/:priority', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { target_hours, description } = req.body;
    if (!target_hours || isNaN(target_hours)) {
      return res.status(400).json({ success: false, message: 'Valid target_hours is required.' });
    }

    await db.runAsync(
      `UPDATE sla_configurations 
       SET target_hours = ?, description = COALESCE(?, description)
       WHERE priority = ?`,
      [parseInt(target_hours), description, req.params.priority]
    );

    res.json({ success: true, message: `SLA updated for priority ${req.params.priority}.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
