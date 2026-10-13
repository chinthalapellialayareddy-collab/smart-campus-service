const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/locations
 * @desc Get all campus locations
 */
router.get('/', async (req, res, next) => {
  try {
    const locations = await db.allAsync(`
      SELECT * FROM campus_locations 
      ORDER BY building_name, block, room_number ASC
    `);
    res.json({ success: true, locations });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/locations
 * @desc Add campus location (Admin only)
 */
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { building_name, block, floor, room_number, details } = req.body;
    if (!building_name) {
      return res.status(400).json({ success: false, message: 'Building name is required.' });
    }

    const result = await db.runAsync(
      `INSERT INTO campus_locations (building_name, block, floor, room_number, details)
       VALUES (?, ?, ?, ?, ?)`,
      [building_name.trim(), block || '', floor || '', room_number || '', details || '']
    );

    res.status(201).json({ success: true, message: 'Campus location added.', id: result.lastID });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
