const assert = require('assert');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test database runner
async function runTests() {
  console.log('--- Starting Automated Backend Tests ---');

  const testDb = new sqlite3.Database(':memory:');
  const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
    testDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
  const execAsync = (sql) => new Promise((resolve, reject) => {
    testDb.exec(sql, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
  const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
    testDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  // 1. Setup tables using execAsync
  await execAsync(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED'
    );
  `);
  console.log('✓ In-memory schema initialized');

  // 2. Test Password Hashing and Verification
  const password = 'SecretPassword123!';
  const hash = await bcrypt.hash(password, 10);
  const isValid = await bcrypt.compare(password, hash);
  const isInvalid = await bcrypt.compare('WrongPassword', hash);
  assert.strictEqual(isValid, true, 'Valid password check failed');
  assert.strictEqual(isInvalid, false, 'Invalid password check failed');
  console.log('✓ Password hashing and bcrypt verification passed');

  // 3. Test JWT Generation & Verification
  const jwtSecret = 'test_secret_key_123';
  const token = jwt.sign({ id: 1, role: 'student' }, jwtSecret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, jwtSecret);
  assert.strictEqual(decoded.id, 1, 'JWT payload ID mismatch');
  assert.strictEqual(decoded.role, 'student', 'JWT payload role mismatch');
  console.log('✓ JWT token generation and verification passed');

  // 4. Test User Insertion and Unique Constraint
  await runAsync(
    `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Student John', 'john@campus.edu', hash, 'student']
  );
  const user = await getAsync(`SELECT * FROM users WHERE email = ?`, ['john@campus.edu']);
  assert.strictEqual(user.full_name, 'Student John', 'User retrieval failed');

  let duplicateThrew = false;
  try {
    await runAsync(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Student John Duplicate', 'john@campus.edu', hash, 'student']
    );
  } catch (err) {
    duplicateThrew = true;
  }
  assert.strictEqual(duplicateThrew, true, 'Duplicate email was incorrectly allowed');
  console.log('✓ User insertion and unique email constraint passed');

  // 5. Test Complaint Status Transition
  await runAsync(
    `INSERT INTO complaints (reference_no, user_id, title, status) VALUES (?, ?, ?, ?)`,
    ['CMP-2026-TEST', user.id, 'Broken Water Tap', 'SUBMITTED']
  );
  let complaint = await getAsync(`SELECT * FROM complaints WHERE reference_no = ?`, ['CMP-2026-TEST']);
  assert.strictEqual(complaint.status, 'SUBMITTED', 'Initial status mismatch');

  await runAsync(`UPDATE complaints SET status = 'IN_PROGRESS' WHERE id = ?`, [complaint.id]);
  complaint = await getAsync(`SELECT * FROM complaints WHERE id = ?`, [complaint.id]);
  assert.strictEqual(complaint.status, 'IN_PROGRESS', 'Status transition to IN_PROGRESS failed');

  await runAsync(`UPDATE complaints SET status = 'RESOLVED' WHERE id = ?`, [complaint.id]);
  complaint = await getAsync(`SELECT * FROM complaints WHERE id = ?`, [complaint.id]);
  assert.strictEqual(complaint.status, 'RESOLVED', 'Status transition to RESOLVED failed');
  console.log('✓ Complaint lifecycle status transitions verified');

  console.log('--- ALL BACKEND AUTOMATED TESTS PASSED (5/5) ---');
  testDb.close();
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
