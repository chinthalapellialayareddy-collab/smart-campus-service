const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { autoAssignStaff, calculateSlaDeadline } = require('../services/assignmentService');

/**
 * Helper: Generate unique reference code, e.g. CMP-2026-X82F
 */
function generateReferenceNo() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CMP-${year}-${rand}`;
}

/**
 * @route POST /api/complaints
 * @desc Create a new campus complaint (Students and Faculty)
 */
router.post('/', authenticateToken, authorizeRoles('student', 'faculty', 'admin'), upload.array('attachments', 3), async (req, res, next) => {
  try {
    const { title, description, category_id, location_id, priority } = req.body;

    if (!title || !description || !category_id || !location_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and location are required fields.'
      });
    }

    // Verify category and fetch SLA
    const category = await db.getAsync(`SELECT * FROM complaint_categories WHERE id = ?`, [category_id]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Selected category does not exist.' });
    }

    // Verify location
    const location = await db.getAsync(`SELECT * FROM campus_locations WHERE id = ?`, [location_id]);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Selected campus location does not exist.' });
    }

    const complaintPriority = priority || category.default_priority || 'Medium';
    const slaDeadline = calculateSlaDeadline(category.sla_hours || 48);
    const referenceNo = generateReferenceNo();

    // Insert complaint
    const complaintResult = await db.runAsync(
      `INSERT INTO complaints 
       (reference_no, user_id, title, description, category_id, location_id, priority, status, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)`,
      [referenceNo, req.user.id, title.trim(), description.trim(), category_id, location_id, complaintPriority, slaDeadline]
    );

    const complaintId = complaintResult.lastID;

    // Record initial status history
    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, NULL, 'SUBMITTED', ?, 'Complaint submitted by user.')`,
      [complaintId, req.user.id]
    );

    // Store uploaded files if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.runAsync(
          `INSERT INTO complaint_attachments (complaint_id, uploaded_by, stored_filename, original_filename, file_path, file_size, file_type, attachment_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'initial')`,
          [complaintId, req.user.id, file.filename, file.originalname, `/uploads/${file.filename}`, file.size, file.mimetype]
        );
      }
    }

    // Fetch admin user(s) to notify
    const adminUsers = await db.allAsync(`SELECT id FROM users WHERE role = 'admin' AND account_status = 'active'`);
    for (const admin of adminUsers) {
      await db.runAsync(
        `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
         VALUES (?, ?, 'New Campus Complaint Submitted', ?, 'ACTION_REQUIRED')`,
        [
          admin.id,
          complaintId,
          `New ticket ${referenceNo} submitted by ${req.user.full_name} (${req.user.role}): "${title.trim()}". Pending staff assignment.`
        ]
      );
    }

    // Notify complainant of complaint receipt
    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Complaint Ticket Registered', ?, 'SUCCESS')`,
      [
        req.user.id,
        complaintId,
        `Your complaint ${referenceNo} has been received and routed to the Campus Admin for staff assignment.`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully and forwarded to administrator for review and staff assignment.',
      complaint: {
        id: complaintId,
        reference_no: referenceNo,
        status: 'SUBMITTED',
        assigned_staff: null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/complaints
 * @desc Get complaints list filtered by user role and query parameters
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, category_id, location_id, priority, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT c.*,
             u.full_name AS complainant_name, u.email AS complainant_email, u.role AS complainant_role,
             cat.name AS category_name,
             loc.building_name, loc.block, loc.floor, loc.room_number,
             staff.full_name AS staff_name, staff.email AS staff_email,
             (SELECT COUNT(*) FROM complaint_comments cm WHERE cm.complaint_id = c.id) AS comment_count,
             (SELECT COUNT(*) FROM complaint_attachments at WHERE at.complaint_id = c.id) AS attachment_count
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN campus_locations loc ON c.location_id = loc.id
      LEFT JOIN users staff ON c.assigned_staff_id = staff.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based scoping
    if (req.user.role === 'student' || req.user.role === 'faculty') {
      // Complainants only see their own complaints
      sql += ` AND c.user_id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'staff') {
      // Maintenance staff only see complaints assigned to them
      sql += ` AND c.assigned_staff_id = ?`;
      params.push(req.user.id);
    }
    // Admin sees all campus complaints

    if (status) {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    if (category_id) {
      sql += ` AND c.category_id = ?`;
      params.push(category_id);
    }

    if (location_id) {
      sql += ` AND c.location_id = ?`;
      params.push(location_id);
    }

    if (priority) {
      sql += ` AND c.priority = ?`;
      params.push(priority);
    }

    if (search) {
      sql += ` AND (c.reference_no LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR loc.room_number LIKE ? OR loc.building_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const complaints = await db.allAsync(sql, params);

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/complaints/:id
 * @desc Get comprehensive single complaint details with comments, attachments, history, feedback
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const complaint = await db.getAsync(
      `SELECT c.*,
              u.full_name AS complainant_name, u.email AS complainant_email, u.role AS complainant_role, u.phone AS complainant_phone,
              cat.name AS category_name, cat.sla_hours,
              d.name AS department_name,
              loc.building_name, loc.block, loc.floor, loc.room_number, loc.details AS location_details,
              staff.full_name AS staff_name, staff.email AS staff_email, staff.phone AS staff_phone
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       JOIN complaint_categories cat ON c.category_id = cat.id
       LEFT JOIN departments d ON cat.department_id = d.id
       JOIN campus_locations loc ON c.location_id = loc.id
       LEFT JOIN users staff ON c.assigned_staff_id = staff.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Role-based authorization
    if (['student', 'faculty'].includes(req.user.role) && complaint.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You cannot access other users’ complaints.' });
    }

    if (req.user.role === 'staff' && complaint.assigned_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: This complaint is not assigned to you.' });
    }

    // Fetch comments
    const comments = await db.allAsync(
      `SELECT cm.*, u.full_name AS author_name, u.role AS author_role
       FROM complaint_comments cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.complaint_id = ?
       ORDER BY cm.created_at ASC`,
      [complaint.id]
    );

    // Fetch attachments
    const attachments = await db.allAsync(
      `SELECT a.*, u.full_name AS uploader_name
       FROM complaint_attachments a
       JOIN users u ON a.uploaded_by = u.id
       WHERE a.complaint_id = ?
       ORDER BY a.created_at ASC`,
      [complaint.id]
    );

    // Fetch history
    const history = await db.allAsync(
      `SELECT h.*, u.full_name AS updater_name, u.role AS updater_role
       FROM complaint_status_history h
       JOIN users u ON h.updated_by = u.id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC`,
      [complaint.id]
    );

    // Fetch feedback if any
    const feedback = await db.getAsync(
      `SELECT f.*, u.full_name AS reviewer_name
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.complaint_id = ?`,
      [complaint.id]
    );

    res.json({
      success: true,
      complaint: {
        ...complaint,
        comments,
        attachments,
        history,
        feedback
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/assign
 * @desc Assign or reassign complaint to maintenance staff (Admin only)
 */
router.post('/:id/assign', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { staff_id, notes } = req.body;

    if (!staff_id) {
      return res.status(400).json({ success: false, message: 'Staff ID is required.' });
    }

    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const staff = await db.getAsync(
      `SELECT id, full_name, email, role, account_status FROM users WHERE id = ? AND role = 'staff'`,
      [staff_id]
    );
    if (!staff || staff.account_status !== 'active') {
      return res.status(400).json({ success: false, message: 'Invalid or inactive staff member.' });
    }

    const prevStatus = complaint.status;
    const newStatus = 'ASSIGNED';

    await db.runAsync(
      `UPDATE complaints 
       SET assigned_staff_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [staff.id, newStatus, complaint.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_assignments (complaint_id, staff_id, assigned_by, assignment_status, notes)
       VALUES (?, ?, ?, 'PENDING', ?)`,
      [complaint.id, staff.id, req.user.id, notes || 'Assigned by Administrator']
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [complaint.id, prevStatus, newStatus, req.user.id, `Reassigned to staff member: ${staff.full_name}`]
    );

    // Notify staff
    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Complaint Assignment', ?, 'ASSIGNMENT')`,
      [staff.id, complaint.id, `You have been assigned to handle ticket ${complaint.reference_no}.`]
    );

    // Notify student/faculty
    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Staff Assigned to Your Complaint', ?, 'STATUS_UPDATE')`,
      [complaint.user_id, complaint.id, `Technician ${staff.full_name} has been assigned to ticket ${complaint.reference_no}.`]
    );

    res.json({
      success: true,
      message: `Successfully assigned to ${staff.full_name}.`,
      assigned_staff_id: staff.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/accept
 * @desc Staff accepts assigned complaint
 */
router.post('/:id/accept', authenticateToken, authorizeRoles('staff'), async (req, res, next) => {
  try {
    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.assigned_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'This complaint is not assigned to you.' });
    }

    await db.runAsync(
      `UPDATE complaints SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [complaint.id]
    );

    await db.runAsync(
      `UPDATE complaint_assignments 
       SET assignment_status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP 
       WHERE complaint_id = ? AND staff_id = ?`,
      [complaint.id, req.user.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, ?, 'ACCEPTED', ?, 'Staff accepted the assignment.')`,
      [complaint.id, complaint.status, req.user.id]
    );

    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Technician Accepted Ticket', ?, 'STATUS_UPDATE')`,
      [complaint.user_id, complaint.id, `Staff member has accepted ticket ${complaint.reference_no} and scheduled work.`]
    );

    res.json({ success: true, message: 'Assignment accepted.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/in-progress
 * @desc Staff sets work in progress
 */
router.post('/:id/in-progress', authenticateToken, authorizeRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user.role === 'staff' && complaint.assigned_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Complaint not assigned to you.' });
    }

    await db.runAsync(
      `UPDATE complaints SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [complaint.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, ?, 'IN_PROGRESS', ?, ?)`,
      [complaint.id, complaint.status, req.user.id, notes || 'Maintenance work actively started on site.']
    );

    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Work In Progress', ?, 'STATUS_UPDATE')`,
      [complaint.user_id, complaint.id, `Maintenance work on ticket ${complaint.reference_no} is now actively in progress.`]
    );

    res.json({ success: true, message: 'Status updated to IN_PROGRESS.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/resolve
 * @desc Staff or Admin marks complaint as resolved (can upload completion photos)
 */
router.post('/:id/resolve', authenticateToken, authorizeRoles('staff', 'admin'), (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.array('completion_photos', 3)(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  } else {
    next();
  }
}, async (req, res, next) => {
  try {
    const { resolution_notes } = req.body || {};
    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user.role === 'staff' && complaint.assigned_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Complaint not assigned to you.' });
    }

    await db.runAsync(
      `UPDATE complaints 
       SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [complaint.id]
    );

    // Update staff assignment record to COMPLETED
    await db.runAsync(
      `UPDATE complaint_assignments
       SET assignment_status = 'COMPLETED'
       WHERE complaint_id = ? AND staff_id = ?`,
      [complaint.id, complaint.assigned_staff_id || req.user.id]
    );

    // Save completion photographs
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.runAsync(
          `INSERT INTO complaint_attachments (complaint_id, uploaded_by, stored_filename, original_filename, file_path, file_size, file_type, attachment_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'completion')`,
          [complaint.id, req.user.id, file.filename, file.originalname, `/uploads/${file.filename}`, file.size, file.mimetype]
        );
      }
    }

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, ?, 'RESOLVED', ?, ?)`,
      [complaint.id, complaint.status, req.user.id, resolution_notes || 'Issue resolved by maintenance staff.']
    );

    // Notify complainant to confirm and give feedback
    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Complaint Resolved - Action Required', ?, 'ACTION_REQUIRED')`,
      [
        complaint.user_id,
        complaint.id,
        `Your complaint ${complaint.reference_no} has been marked as RESOLVED. Please verify the solution and provide your feedback.`
      ]
    );

    res.json({ success: true, message: 'Complaint marked as RESOLVED.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/close
 * @desc Complainant or Admin confirms resolution and closes the complaint
 */
router.post('/:id/close', authenticateToken, async (req, res, next) => {
  try {
    const { rating, feedback_comments } = req.body;
    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Only complainant or admin can close
    if (req.user.role !== 'admin' && complaint.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the complaint owner or admin can close this ticket.' });
    }

    // Rating and Feedback comments MUST and SHOULD be provided
    if (!rating || parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: 'Feedback rating (1 to 5 stars) is mandatory to close the ticket.'
      });
    }

    if (!feedback_comments || !feedback_comments.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback remarks/comments are mandatory. Please provide a brief note on the resolution quality.'
      });
    }

    await db.runAsync(
      `UPDATE complaints 
       SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [complaint.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, ?, 'CLOSED', ?, 'Resolution confirmed by user with feedback rating: ' || ? || ' stars.')`,
      [complaint.id, complaint.status, req.user.id, rating]
    );

    // Save mandatory user rating & review
    const numRating = Math.max(1, Math.min(5, parseInt(rating)));
    await db.runAsync(
      `INSERT OR REPLACE INTO feedback (complaint_id, user_id, rating, comments)
       VALUES (?, ?, ?, ?)`,
      [complaint.id, req.user.id, numRating, feedback_comments.trim()]
    );

    // Notify staff and admin of completion & feedback
    if (complaint.assigned_staff_id) {
      await db.runAsync(
        `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
         VALUES (?, ?, 'User Feedback Received', ?, 'FEEDBACK')`,
        [
          complaint.assigned_staff_id,
          complaint.id,
          `The complainant closed ticket ${complaint.reference_no} with a ${numRating}★ rating: "${feedback_comments.trim()}".`
        ]
      );
    }

    res.json({ success: true, message: 'Complaint ticket closed and feedback recorded successfully. Thank you!' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/reopen
 * @desc Complainant reopens an unsatisfactory resolution
 */
router.post('/:id/reopen', authenticateToken, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user.role !== 'admin' && complaint.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only complainant or admin can reopen this ticket.' });
    }

    if (!['RESOLVED', 'CLOSED'].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: 'Only RESOLVED or CLOSED tickets can be reopened.' });
    }

    await db.runAsync(
      `UPDATE complaints 
       SET status = 'REOPENED', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [complaint.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, ?, 'REOPENED', ?, ?)`,
      [complaint.id, complaint.status, req.user.id, reason || 'Complainant reopened ticket: Problem persists.']
    );

    if (complaint.assigned_staff_id) {
      await db.runAsync(
        `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
         VALUES (?, ?, 'Complaint Reopened', ?, 'ALERT')`,
        [
          complaint.assigned_staff_id,
          complaint.id,
          `Ticket ${complaint.reference_no} has been reopened by complainant: "${reason || 'Problem persists'}"`
        ]
      );
    }

    res.json({ success: true, message: 'Complaint successfully reopened.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/comments
 * @desc Add follow-up comment to a complaint
 */
router.post('/:id/comments', authenticateToken, async (req, res, next) => {
  try {
    const { comment_text } = req.body;
    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
    }

    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Role check
    if (['student', 'faculty'].includes(req.user.role) && complaint.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    if (req.user.role === 'staff' && complaint.assigned_staff_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const result = await db.runAsync(
      `INSERT INTO complaint_comments (complaint_id, user_id, comment_text)
       VALUES (?, ?, ?)`,
      [complaint.id, req.user.id, comment_text.trim()]
    );

    // If complainant commented, notify staff or admin
    if (req.user.id === complaint.user_id && complaint.assigned_staff_id) {
      await db.runAsync(
        `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
         VALUES (?, ?, 'New Comment from Student/Faculty', ?, 'COMMENT')`,
        [complaint.assigned_staff_id, complaint.id, `New comment on ticket ${complaint.reference_no}.`]
      );
    } else if (req.user.id !== complaint.user_id) {
      // Staff or admin commented, notify student
      await db.runAsync(
        `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
         VALUES (?, ?, 'Update on your Complaint', ?, 'COMMENT')`,
        [complaint.user_id, complaint.id, `${req.user.full_name} added a comment to ticket ${complaint.reference_no}.`]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment posted.',
      commentId: result.lastID
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/complaints/:id/attachments
 * @desc Upload additional supporting image to a complaint
 */
router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const complaint = await db.getAsync(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const result = await db.runAsync(
      `INSERT INTO complaint_attachments (complaint_id, uploaded_by, stored_filename, original_filename, file_path, file_size, file_type, attachment_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'followup')`,
      [complaint.id, req.user.id, req.file.filename, req.file.originalname, `/uploads/${req.file.filename}`, req.file.size, req.file.mimetype]
    );

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully.',
      attachmentId: result.lastID,
      file_path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
