const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_complaint_service_super_secret_key_2026';

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user record from database to verify active status
    const user = await db.getAsync(
      `SELECT id, full_name, email, role, department_id, account_status, phone FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token: User no longer exists.' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({ success: false, message: 'User account has been suspended or deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Authentication session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or forged token.' });
  }
};

/**
 * Middleware factory for role-based authorization
 * @param  {...string} roles Allowed roles ('student', 'faculty', 'staff', 'admin')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Required role: [${roles.join(', ')}]. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
