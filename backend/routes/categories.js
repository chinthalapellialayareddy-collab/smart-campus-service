const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/categories
 * @desc Get all active complaint categories with responsible department details
 */
router.get('/', async (req, res, next) => {
  try {
    const categories = await db.allAsync(`
      SELECT c.*, d.name AS department_name
      FROM complaint_categories c
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.name ASC
    `);
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/categories
 * @desc Create new category (Admin only)
 */
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { name, description, department_id, default_priority, sla_hours } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const result = await db.runAsync(
      `INSERT INTO complaint_categories (name, description, department_id, default_priority, sla_hours)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), description || '', department_id || null, default_priority || 'Medium', sla_hours || 48]
    );

    res.status(201).json({ success: true, message: 'Category created successfully.', id: result.lastID });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/categories/:id
 * @desc Update category (Admin only)
 */
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { name, description, department_id, default_priority, sla_hours, is_active } = req.body;

    await db.runAsync(
      `UPDATE complaint_categories 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           department_id = COALESCE(?, department_id),
           default_priority = COALESCE(?, default_priority),
           sla_hours = COALESCE(?, sla_hours),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, department_id, default_priority, sla_hours, is_active, req.params.id]
    );

    res.json({ success: true, message: 'Category updated successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
