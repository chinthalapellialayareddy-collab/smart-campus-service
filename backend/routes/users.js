const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/users
 * @desc List users (Admin only, or staff list for assignment)
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'faculty', 'staff'), async (req, res, next) => {
  try {
    const { role, department_id, search } = req.query;

    let sql = `
      SELECT u.id, u.full_name, u.email, u.role, u.department_id, u.account_status, u.phone, u.created_at,
             d.name AS department_name,
             (SELECT COUNT(*) FROM complaints c WHERE c.assigned_staff_id = u.id AND c.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS')) AS active_workload
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Students cannot view general user list
    if (role) {
      sql += ` AND u.role = ?`;
      params.push(role);
    }

    if (department_id) {
      sql += ` AND u.department_id = ?`;
      params.push(department_id);
    }

    if (search) {
      sql += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY u.role, u.full_name ASC`;

    const users = await db.allAsync(sql, params);
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/staff
 * @desc Get available maintenance staff list with workloads (Used for manual assignment)
 */
router.get('/staff', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const sql = `
      SELECT u.id, u.full_name, u.email, u.role, u.department_id, u.phone,
             d.name AS department_name,
             (SELECT COUNT(*) FROM complaints c WHERE c.assigned_staff_id = u.id AND c.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS')) AS active_workload,
             (SELECT COUNT(*) FROM complaints c WHERE c.assigned_staff_id = u.id AND c.status = 'RESOLVED') AS resolved_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'staff' AND u.account_status = 'active'
      ORDER BY u.department_id, active_workload ASC
    `;
    const staff = await db.allAsync(sql);
    res.json({ success: true, staff });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/users
 * @desc Create staff or admin account (Admin only)
 */
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { full_name, email, password, role, department_id, phone } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const normalizedRole = role.toLowerCase();
    if (!['student', 'faculty', 'staff', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    // UNIQUE ADMIN RULE: There must be only one unique administrator in the system
    if (normalizedRole === 'admin') {
      const adminCount = await db.getAsync(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
      if (adminCount && adminCount.count >= 1) {
        return res.status(400).json({
          success: false,
          message: 'Policy constraint: The campus system enforces a single UNIQUE Administrator account. You cannot create another administrator.'
        });
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.getAsync(`SELECT id FROM users WHERE email = ?`, [cleanEmail]);
    if (existing) {
      return res.status(409).json({ success: false, message: `Account with email "${cleanEmail}" already exists. Please choose a unique email.` });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.runAsync(
      `INSERT INTO users (full_name, email, password_hash, role, department_id, phone, account_status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [full_name.trim(), cleanEmail, passwordHash, normalizedRole, department_id || null, phone || null]
    );

    res.status(201).json({
      success: true,
      message: `${normalizedRole.toUpperCase()} account successfully created with unique credentials.`,
      user: {
        id: result.lastID,
        full_name: full_name.trim(),
        email: cleanEmail,
        role: normalizedRole
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/users/:id/status
 * @desc Activate or suspend user account (Admin only)
 */
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { account_status } = req.body;
    if (!['active', 'suspended', 'inactive'].includes(account_status)) {
      return res.status(400).json({ success: false, message: 'Invalid account status value.' });
    }

    const user = await db.getAsync(`SELECT id, role FROM users WHERE id = ?`, [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deactivating own admin account
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account.' });
    }

    await db.runAsync(
      `UPDATE users SET account_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [account_status, req.params.id]
    );

    res.json({ success: true, message: `Account status updated to ${account_status}.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
