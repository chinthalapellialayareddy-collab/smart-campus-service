const { db } = require('../config/db');

/**
 * Automatically assign an eligible maintenance staff member to a complaint based on category and current workload
 * @param {number} complaintId
 * @param {number} categoryId
 * @param {number} adminId Optional admin ID if manually triggered, otherwise system
 * @returns {Promise<object|null>} Assigned staff member or null
 */
async function autoAssignStaff(complaintId, categoryId, adminId = null) {
  try {
    // 1. Get responsible department for category
    const category = await db.getAsync(
      `SELECT id, name, department_id, sla_hours FROM complaint_categories WHERE id = ?`,
      [categoryId]
    );

    if (!category || !category.department_id) {
      console.log(`AutoAssign: No department mapped for category ${categoryId}`);
      return null;
    }

    // 2. Find eligible active staff members in this department
    // Sort by current active workload (least busy first)
    const staffQuery = `
      SELECT u.id, u.full_name, u.email,
        (SELECT COUNT(*) FROM complaints c WHERE c.assigned_staff_id = u.id AND c.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS')) AS active_workload
      FROM users u
      WHERE u.role = 'staff' 
        AND u.account_status = 'active'
        AND u.department_id = ?
      ORDER BY active_workload ASC, u.id ASC
      LIMIT 1
    `;

    const selectedStaff = await db.getAsync(staffQuery, [category.department_id]);

    if (!selectedStaff) {
      console.log(`AutoAssign: No eligible staff found in department ${category.department_id}`);
      return null;
    }

    // 3. Assign staff to complaint
    await db.runAsync(
      `UPDATE complaints 
       SET assigned_staff_id = ?, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [selectedStaff.id, complaintId]
    );

    // 4. Record in assignment table
    await db.runAsync(
      `INSERT INTO complaint_assignments (complaint_id, staff_id, assigned_by, assignment_status, notes)
       VALUES (?, ?, ?, 'PENDING', 'Auto-assigned based on category specialization and staff workload.')`,
      [complaintId, selectedStaff.id, adminId || selectedStaff.id]
    );

    // 5. Record status history
    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, 'SUBMITTED', 'ASSIGNED', ?, ?)`,
      [complaintId, adminId || selectedStaff.id, `Assigned to ${selectedStaff.full_name} (${selectedStaff.email})`]
    );

    // 6. Notify the staff member
    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'New Assigned Campus Complaint', ?, 'ASSIGNMENT')`,
      [
        selectedStaff.id,
        complaintId,
        `You have been assigned complaint ticket #${complaintId} in ${category.name}. Please review and accept.`
      ]
    );

    return selectedStaff;
  } catch (error) {
    console.error('Error during automatic staff assignment:', error);
    return null;
  }
}

/**
 * Calculate SLA deadline timestamp based on category priority/hours
 */
function calculateSlaDeadline(hours = 48) {
  const d = new Date();
  d.setHours(d.getHours() + (hours || 48));
  return d.toISOString();
}

module.exports = {
  autoAssignStaff,
  calculateSlaDeadline
};
