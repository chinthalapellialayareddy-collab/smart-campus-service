const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * @route GET /api/analytics/dashboard
 * @desc Get key KPI metrics and distribution counts
 */
router.get('/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let whereClause = '';
    const params = [];

    if (role === 'student' || role === 'faculty') {
      whereClause = 'WHERE user_id = ?';
      params.push(userId);
    } else if (role === 'staff') {
      whereClause = 'WHERE assigned_staff_id = ?';
      params.push(userId);
    }

    // 1. Status Counts
    const statusCounts = await db.allAsync(
      `SELECT status, COUNT(*) AS count 
       FROM complaints 
       ${whereClause}
       GROUP BY status`,
      params
    );

    // 2. Priority Counts
    const priorityCounts = await db.allAsync(
      `SELECT priority, COUNT(*) AS count 
       FROM complaints 
       ${whereClause}
       GROUP BY priority`,
      params
    );

    // 3. Category Counts
    const categoryCounts = await db.allAsync(
      `SELECT cat.name AS category_name, COUNT(c.id) AS count
       FROM complaints c
       JOIN complaint_categories cat ON c.category_id = cat.id
       ${whereClause ? whereClause.replace('WHERE', 'WHERE c.') : ''}
       GROUP BY cat.name
       ORDER BY count DESC
       LIMIT 6`,
      params
    );

    // 4. Overdue Count
    let overdueSql = `
      SELECT COUNT(*) AS count 
      FROM complaints 
      WHERE status NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED') 
        AND sla_deadline IS NOT NULL 
        AND datetime(sla_deadline) < datetime('now')
    `;
    const overdueParams = [];
    if (role === 'student' || role === 'faculty') {
      overdueSql += ' AND user_id = ?';
      overdueParams.push(userId);
    } else if (role === 'staff') {
      overdueSql += ' AND assigned_staff_id = ?';
      overdueParams.push(userId);
    }
    const overdueRes = await db.getAsync(overdueSql, overdueParams);

    // 5. Overall Totals
    const totalComplaints = statusCounts.reduce((acc, curr) => acc + curr.count, 0);
    const resolvedComplaints = (statusCounts.find(s => s.status === 'RESOLVED') || { count: 0 }).count;
    const closedComplaints = (statusCounts.find(s => s.status === 'CLOSED') || { count: 0 }).count;
    const pendingComplaints = totalComplaints - (resolvedComplaints + closedComplaints);

    // 6. Satisfaction Rating
    const avgRatingRow = await db.getAsync(`
      SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews 
      FROM feedback
    `);

    res.json({
      success: true,
      metrics: {
        total: totalComplaints,
        pending: pendingComplaints,
        resolved: resolvedComplaints + closedComplaints,
        overdue: overdueRes ? overdueRes.count : 0,
        averageRating: avgRatingRow && avgRatingRow.avg_rating ? parseFloat(avgRatingRow.avg_rating).toFixed(1) : '5.0',
        totalReviews: avgRatingRow ? avgRatingRow.total_reviews : 0
      },
      statusDistribution: statusCounts,
      priorityDistribution: priorityCounts,
      categoryDistribution: categoryCounts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/staff-workload
 * @desc Get workload metrics for all staff (Admin only)
 */
router.get('/staff-workload', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const workloads = await db.allAsync(`
      SELECT u.id, u.full_name, u.email, d.name AS department_name,
        SUM(CASE WHEN c.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS active_tasks,
        SUM(CASE WHEN c.status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS completed_tasks,
        COUNT(c.id) AS total_assigned
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN complaints c ON c.assigned_staff_id = u.id
      WHERE u.role = 'staff' AND u.account_status = 'active'
      GROUP BY u.id
      ORDER BY active_tasks DESC
    `);

    res.json({ success: true, workloads });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
