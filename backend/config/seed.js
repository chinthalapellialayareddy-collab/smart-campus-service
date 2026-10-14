const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./db');

async function seedData() {
  await initSchema();

  console.log('Seeding demo database...');

  // 1. SLA Configurations
  const defaultSlas = [
    { priority: 'Emergency', hours: 4, desc: 'Immediate threat to campus safety or power/water blackout' },
    { priority: 'High', hours: 24, desc: 'Critical equipment failure affecting lectures or labs' },
    { priority: 'Medium', hours: 48, desc: 'Standard maintenance or non-urgent repairs' },
    { priority: 'Low', hours: 96, desc: 'Cosmetic or minor aesthetic issues' }
  ];

  for (const sla of defaultSlas) {
    await db.runAsync(
      `INSERT OR IGNORE INTO sla_configurations (priority, target_hours, description) VALUES (?, ?, ?)`,
      [sla.priority, sla.hours, sla.desc]
    );
  }

  // 2. Departments
  const departments = [
    { name: 'Electrical & Power Works', desc: 'Handles power outages, wiring, switches, lighting, and air conditioning' },
    { name: 'Plumbing & Water Management', desc: 'Handles pipe leaks, washroom sanitation, water coolers, taps' },
    { name: 'Civil & Infrastructure', desc: 'Handles masonry, broken doors, windows, paint, furniture, carpentry' },
    { name: 'IT & Campus Network', desc: 'Handles campus WiFi, Ethernet points, projectors, computer lab hardware' },
    { name: 'Sanitation & Housekeeping', desc: 'Campus cleanliness, waste disposal, dustbins, hygiene management' }
  ];

  for (const dept of departments) {
    await db.runAsync(
      `INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)`,
      [dept.name, dept.desc]
    );
  }

  // 3. Campus Locations
  const locations = [
    { building: 'Science & Engineering Block', block: 'Block A', floor: 'Ground Floor', room: 'Physics Lab 102', details: 'North wing, near main staircase' },
    { building: 'Science & Engineering Block', block: 'Block A', floor: '2nd Floor', room: 'Computer Lab CS-04', details: 'Equipped with 60 workstations' },
    { building: 'Central Administrative Building', block: 'Main Admin', floor: '1st Floor', room: 'Registrar Office', details: 'Front entrance' },
    { building: 'Ramanujan Academic Complex', block: 'Block C', floor: '3rd Floor', room: 'Lecture Hall 301', details: 'Capacity 120 students' },
    { building: 'Dr. APJ Abdul Kalam Library', block: 'Library Wing', floor: '2nd Floor', room: 'Digital Reading Room', details: 'Quiet study zone' },
    { building: 'Boys Hostel Complex', block: 'Ganga Hostel', floor: '1st Floor', room: 'Room 114', details: 'Wing B residential' },
    { building: 'Girls Hostel Complex', block: 'Yamuna Hostel', floor: '2nd Floor', room: 'Room 208', details: 'Wing A residential' },
    { building: 'Campus Cafeteria & Food Court', block: 'Dining Block', floor: 'Ground Floor', room: 'Main Dining Hall', details: 'Central student hub' },
    { building: 'Indoor Sports Arena', block: 'Sports Wing', floor: 'Ground Floor', room: 'Badminton Court 2', details: 'Recreation area' }
  ];

  for (const loc of locations) {
    const existing = await db.getAsync(
      `SELECT id FROM campus_locations WHERE building_name = ? AND block = ? AND room_number = ?`,
      [loc.building, loc.block, loc.room]
    );
    if (!existing) {
      await db.runAsync(
        `INSERT INTO campus_locations (building_name, block, floor, room_number, details) VALUES (?, ?, ?, ?, ?)`,
        [loc.building, loc.block, loc.floor, loc.room, loc.details]
      );
    }
  }

  // 4. Complaint Categories
  const categories = [
    { name: 'Electrical & Lighting', deptName: 'Electrical & Power Works', priority: 'High', sla: 24, desc: 'Flickering lights, fan issues, switchboard sparking, power outages' },
    { name: 'Plumbing & Restroom', deptName: 'Plumbing & Water Management', priority: 'High', sla: 24, desc: 'Clogged drains, leaking faucets, washroom water issues' },
    { name: 'Air Conditioning & Ventilation', deptName: 'Electrical & Power Works', priority: 'Medium', sla: 48, desc: 'AC cooling failure, fan repairs, strange noises' },
    { name: 'Campus WiFi & Internet', deptName: 'IT & Campus Network', priority: 'High', sla: 24, desc: 'No connectivity, router dropouts, slow campus bandwidth' },
    { name: 'Classroom Projector & Audio', deptName: 'IT & Campus Network', priority: 'High', sla: 12, desc: 'Faulty projection, microphone or speaker failures during lectures' },
    { name: 'Desk, Chairs & Furniture', deptName: 'Civil & Infrastructure', priority: 'Low', sla: 72, desc: 'Broken benches, desk chairs, podium or whiteboard damages' },
    { name: 'Sanitation & Cleanliness', deptName: 'Sanitation & Housekeeping', priority: 'Medium', sla: 24, desc: 'Garbage accumulation, spills, uncleaned washrooms or corridors' },
    { name: 'Drinking Water Coolers', deptName: 'Plumbing & Water Management', priority: 'Emergency', sla: 8, desc: 'Water purifier failure, dirty water, leakages near dispenser' },
    { name: 'Civil & Structural Repairs', deptName: 'Civil & Infrastructure', priority: 'Medium', sla: 96, desc: 'Cracked window panes, door locks jammed, ceiling seepage' }
  ];

  for (const cat of categories) {
    const dept = await db.getAsync(`SELECT id FROM departments WHERE name = ?`, [cat.deptName]);
    const deptId = dept ? dept.id : null;
    await db.runAsync(
      `INSERT OR IGNORE INTO complaint_categories (name, description, department_id, default_priority, sla_hours) VALUES (?, ?, ?, ?, ?)`,
      [cat.name, cat.desc, deptId, cat.priority, cat.sla]
    );
  }

  // 5. Demo Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      full_name: 'Dr. Sarah Mitchell (Chief Admin)',
      email: 'admin@campus.edu',
      role: 'admin',
      deptName: null,
      phone: '+1 555-0101'
    },
    {
      full_name: 'Prof. Alan Vance (Faculty)',
      email: 'faculty1@gmail.com',
      role: 'faculty',
      deptName: 'Science & Engineering Block',
      phone: '+1 555-0102'
    },
    {
      full_name: 'Prof. Alan Vance (Faculty)',
      email: 'faculty@campus.edu',
      role: 'faculty',
      deptName: 'Science & Engineering Block',
      phone: '+1 555-0102'
    },
    {
      full_name: 'Emily Watson (Student)',
      email: 'name@gmail.com',
      role: 'student',
      deptName: null,
      phone: '+1 555-0103'
    },
    {
      full_name: 'Student User',
      email: 'student@campus.edu',
      role: 'student',
      deptName: null,
      phone: '+1 555-0103'
    },
    {
      full_name: 'Robert Miller (Electrician)',
      email: 'staff1@gmail.com',
      role: 'staff',
      deptName: 'Electrical & Power Works',
      phone: '+1 555-0104'
    },
    {
      full_name: 'Robert Miller (Electrician)',
      email: 'staff.electric@campus.edu',
      role: 'staff',
      deptName: 'Electrical & Power Works',
      phone: '+1 555-0104'
    },
    {
      full_name: 'David Jenkins (Plumber)',
      email: 'staff2@gmail.com',
      role: 'staff',
      deptName: 'Plumbing & Water Management',
      phone: '+1 555-0105'
    },
    {
      full_name: 'David Jenkins (Plumber)',
      email: 'staff.plumb@campus.edu',
      role: 'staff',
      deptName: 'Plumbing & Water Management',
      phone: '+1 555-0105'
    },
    {
      full_name: 'Vikram Patel (IT Support)',
      email: 'staff3@gmail.com',
      role: 'staff',
      deptName: 'IT & Campus Network',
      phone: '+1 555-0106'
    },
    {
      full_name: 'Vikram Patel (IT Support)',
      email: 'staff.it@campus.edu',
      role: 'staff',
      deptName: 'IT & Campus Network',
      phone: '+1 555-0106'
    }
  ];

  for (const user of users) {
    let deptId = null;
    if (user.deptName) {
      const d = await db.getAsync(`SELECT id FROM departments WHERE name = ?`, [user.deptName]);
      if (d) deptId = d.id;
    }
    const existing = await db.getAsync(`SELECT id FROM users WHERE email = ?`, [user.email]);
    if (!existing) {
      await db.runAsync(
        `INSERT INTO users (full_name, email, password_hash, role, department_id, phone, account_status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [user.full_name, user.email, passwordHash, user.role, deptId, user.phone]
      );
    }
  }

  // Retrieve user and category IDs to generate realistic complaints
  const adminUser = await db.getAsync(`SELECT id FROM users WHERE email = 'admin@campus.edu'`);
  const studentUser = await db.getAsync(`SELECT id FROM users WHERE email = 'name@gmail.com'`);
  const facultyUser = await db.getAsync(`SELECT id FROM users WHERE email = 'faculty1@gmail.com'`);
  const electricStaff = await db.getAsync(`SELECT id FROM users WHERE email = 'staff1@gmail.com'`);
  const itStaff = await db.getAsync(`SELECT id FROM users WHERE email = 'staff3@gmail.com'`);
  const plumbStaff = await db.getAsync(`SELECT id FROM users WHERE email = 'staff2@gmail.com'`);

  const catElectrical = await db.getAsync(`SELECT id FROM complaint_categories WHERE name = 'Electrical & Lighting'`);
  const catWifi = await db.getAsync(`SELECT id FROM complaint_categories WHERE name = 'Campus WiFi & Internet'`);
  const catProjector = await db.getAsync(`SELECT id FROM complaint_categories WHERE name = 'Classroom Projector & Audio'`);
  const catWater = await db.getAsync(`SELECT id FROM complaint_categories WHERE name = 'Drinking Water Coolers'`);

  const locLab = await db.getAsync(`SELECT id FROM campus_locations WHERE room_number = 'Computer Lab CS-04'`);
  const locHall = await db.getAsync(`SELECT id FROM campus_locations WHERE room_number = 'Lecture Hall 301'`);
  const locHostel = await db.getAsync(`SELECT id FROM campus_locations WHERE room_number = 'Room 114'`);
  const locLibrary = await db.getAsync(`SELECT id FROM campus_locations WHERE room_number = 'Digital Reading Room'`);

  const existingComplaints = await db.allAsync(`SELECT id FROM complaints`);
  if (existingComplaints.length === 0 && studentUser && facultyUser) {
    console.log('Populating initial demo complaints...');

    // 1. Complaint: In Progress Electrical issue
    const c1Res = await db.runAsync(
      `INSERT INTO complaints (reference_no, user_id, title, description, category_id, location_id, priority, status, assigned_staff_id, sla_deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+18 hours'), datetime('now', '-6 hours'))`,
      [
        'CMP-2026-001',
        studentUser.id,
        'Fluorescent lights sparking and flickering in CS Lab 4',
        'Overhead lights 3 and 4 near the back rows are sparking intermittently, creating a safety hazard and distraction for students during coding practicals.',
        catElectrical.id,
        locLab.id,
        'High',
        'IN_PROGRESS',
        electricStaff.id
      ]
    );

    await db.runAsync(
      `INSERT INTO complaint_assignments (complaint_id, staff_id, assigned_by, assignment_status, notes)
       VALUES (?, ?, ?, 'ACCEPTED', 'Assigned directly to certified electrical technician.')`,
      [c1Res.lastID, electricStaff.id, adminUser.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, 'SUBMITTED', 'ASSIGNED', ?, 'Complaint assigned to Robert Miller.')`,
      [c1Res.lastID, adminUser.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, 'ASSIGNED', 'IN_PROGRESS', ?, 'Replacement ballast and LED drivers ordered from central inventory.')`,
      [c1Res.lastID, electricStaff.id]
    );

    await db.runAsync(
      `INSERT INTO complaint_comments (complaint_id, user_id, comment_text)
       VALUES (?, ?, 'Electrician arrived on site at 11:30 AM to inspect voltage fluctuations.')`,
      [c1Res.lastID, electricStaff.id]
    );

    // 2. Complaint: Submitted (Unassigned) IT issue
    const c2Res = await db.runAsync(
      `INSERT INTO complaints (reference_no, user_id, title, description, category_id, location_id, priority, status, sla_deadline, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', datetime('now', '+12 hours'), datetime('now', '-2 hours'))`,
      [
        'CMP-2026-002',
        facultyUser.id,
        'High-definition projector HDMI signal not detecting in LH 301',
        'The main classroom projector in Lecture Hall 301 fails to display any video feed from laptop HDMI or wireless screencast dongle. Upcoming guest lecture in 2 hours.',
        catProjector.id,
        locHall.id,
        'High'
      ]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, NULL, 'SUBMITTED', ?, 'Complaint ticket logged by Faculty Alan Vance.')`,
      [c2Res.lastID, facultyUser.id]
    );

    // 3. Complaint: Resolved Water Cooler Emergency
    const c3Res = await db.runAsync(
      `INSERT INTO complaints (reference_no, user_id, title, description, category_id, location_id, priority, status, assigned_staff_id, sla_deadline, resolved_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'RESOLVED', ?, datetime('now', '-4 hours'), datetime('now', '-1 hours'), datetime('now', '-18 hours'))`,
      [
        'CMP-2026-003',
        studentUser.id,
        'Drinking water cooler leaking heavily on hostel 1st floor corridor',
        'Water cooler near room 114 is overflowing onto the tiled hallway floor, posing slip and fall risks for residents.',
        catWater.id,
        locHostel.id,
        'Emergency',
        plumbStaff.id
      ]
    );

    await db.runAsync(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, updated_by, notes)
       VALUES (?, 'IN_PROGRESS', 'RESOLVED', ?, 'Drainage trap unclogged and float valve replaced. Floor cleaned dry.')`,
      [c3Res.lastID, plumbStaff.id]
    );

    await db.runAsync(
      `INSERT INTO feedback (complaint_id, user_id, rating, comments)
       VALUES (?, ?, 5, 'Super fast response! Fixed within 2 hours of submitting the ticket.')`,
      [c3Res.lastID, studentUser.id]
    );

    // Notifications for student & admin
    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'Complaint Work in Progress', 'Electrician Robert Miller has started work on ticket CMP-2026-001.', 'STATUS_UPDATE')`,
      [studentUser.id, c1Res.lastID]
    );

    await db.runAsync(
      `INSERT INTO notifications (recipient_id, complaint_id, title, message, type)
       VALUES (?, ?, 'New Urgent Faculty Ticket', 'Prof. Alan Vance submitted high-priority ticket CMP-2026-002 for LH 301.', 'NEW_COMPLAINT')`,
      [adminUser.id, c2Res.lastID]
    );
  }

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
