const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/reports/summary
 * @desc Get filtered report data with summary figures
 */
router.get('/summary', authenticateToken, authorizeRoles('admin', 'faculty', 'staff'), async (req, res, next) => {
  try {
    const { start_date, end_date, category_id, priority, status } = req.query;

    let sql = `
      SELECT c.id, c.reference_no, c.title, c.priority, c.status, c.created_at, c.resolved_at,
             cat.name AS category_name,
             loc.building_name, loc.room_number,
             u.full_name AS complainant_name,
             staff.full_name AS staff_name,
             f.rating AS feedback_rating
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN campus_locations loc ON c.location_id = loc.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      LEFT JOIN feedback f ON f.complaint_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ` AND date(c.created_at) >= date(?)`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND date(c.created_at) <= date(?)`;
      params.push(end_date);
    }
    if (category_id) {
      sql += ` AND c.category_id = ?`;
      params.push(category_id);
    }
    if (priority) {
      sql += ` AND c.priority = ?`;
      params.push(priority);
    }
    if (status) {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const records = await db.allAsync(sql, params);

    res.json({
      success: true,
      totalRecords: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/export-csv
 * @desc Export complaint reports as downloadable CSV formatted text
 */
router.get('/export-csv', authenticateToken, authorizeRoles('admin', 'faculty'), async (req, res, next) => {
  try {
    const sql = `
      SELECT c.reference_no, c.title, cat.name AS category, loc.building_name, loc.room_number,
             c.priority, c.status, u.full_name AS complainant, staff.full_name AS assigned_staff,
             c.created_at, c.resolved_at, f.rating
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN campus_locations loc ON c.location_id = loc.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      LEFT JOIN feedback f ON f.complaint_id = c.id
      ORDER BY c.created_at DESC
    `;

    const rows = await db.allAsync(sql);

    // Build CSV
    const headers = ['Reference No', 'Title', 'Category', 'Building', 'Room', 'Priority', 'Status', 'Complainant', 'Staff', 'Created At', 'Resolved At', 'Rating'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const line = [
        `"${r.reference_no || ''}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.category || ''}"`,
        `"${r.building_name || ''}"`,
        `"${r.room_number || ''}"`,
        `"${r.priority || ''}"`,
        `"${r.status || ''}"`,
        `"${r.complainant || ''}"`,
        `"${r.assigned_staff || 'Unassigned'}"`,
        `"${r.created_at || ''}"`,
        `"${r.resolved_at || ''}"`,
        `"${r.rating || 'N/A'}"`
      ];
      csvLines.push(line.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="campus_complaints_report.csv"');
    res.status(200).send(csvLines.join('\n'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
