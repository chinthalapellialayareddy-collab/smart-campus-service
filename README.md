# Campus Complaint Service System

A full-stack web application designed for colleges and universities to manage, track, and resolve campus infrastructure, academic, electrical, water, and sanitation complaints across students, faculty, maintenance staff, and administrators.

---

## 🏗️ Architecture & Technologies

- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide Icons, Modern CSS Design System
- **Backend**: Node.js, Express.js (CommonJS REST APIs), JSON Web Tokens (JWT), bcryptjs
- **Database**: SQLite with persistent relational schema, foreign key enforcement, indexes
- **Uploads**: Multer (sanitized filenames, mime validation, 5MB limit)

---

## 👥 User Roles & Capabilities

1. **Student**: Register, lodge campus complaints with images, track ticket lifecycle, submit follow-up comments, rate maintenance resolution (1-5 stars), reopen unresolved issues.
2. **Faculty**: Submit classroom, lab, projector, AC, and Wi-Fi issues with priority tagging, track tickets, add notes.
3. **Maintenance Staff**: Access assigned tasks, accept tickets, update progress to `IN_PROGRESS`, submit completion notes and photographs, mark complaints `RESOLVED`.
4. **Administrator**: Campus-wide dashboard analytics, rule-based automatic assignment & manual reassignment, SLA benchmark duration management, user role activation/suspension, CSV report exports.

---

## 🚀 Quick Setup & Running Locally

### 1. Backend Setup
```bash
cd backend
npm install
node config/seed.js    # Seeds demo departments, campus locations, categories, accounts, and sample tickets
node server.js         # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Accounts (Pre-seeded with password: `Campus@123`)

| Role | Email | Password | Scope |
|------|-------|----------|-------|
| **Administrator** | `admin@campus.edu` | `Campus@123` | Campus-wide management, SLA, Users |
| **Faculty** | `faculty@campus.edu` | `Campus@123` | Classroom & Lab issue tickets |
| **Student** | `student@campus.edu` | `Campus@123` | Student hostel & lab complaints |
| **Electrician Staff** | `staff.electric@campus.edu` | `Campus@123` | Power & lighting tasks |
| **Plumber Staff** | `staff.plumb@campus.edu` | `Campus@123` | Plumbing & water dispenser tasks |
| **IT Staff** | `staff.it@campus.edu` | `Campus@123` | Projectors, Wi-Fi, Ethernet tasks |

*(Tip: 1-Click quick login buttons are also provided directly on the Login page for instant demonstration).*

---

## 🧪 Automated Testing

To run the automated backend test suite:
```bash
cd backend
node tests/api.test.js
```
Verifies:
- Password hashing with bcrypt
- JWT generation and payload verification
- SQLite unique constraints
- Complaint lifecycle status transitions (`SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`)

---

## 📡 Key REST API Endpoints

- `POST /api/auth/register` - Self-registration for students and faculty
- `POST /api/auth/login` - Secure login & token generation
- `GET /api/auth/me` - Profile data
- `GET /api/complaints` - Role-scoped complaint listings with filters
- `POST /api/complaints` - Multi-part form complaint creation with attachments
- `POST /api/complaints/:id/assign` - Staff assignment (Admin)
- `POST /api/complaints/:id/accept` - Accept assignment (Staff)
- `POST /api/complaints/:id/in-progress` - Start repair work (Staff)
- `POST /api/complaints/:id/resolve` - Mark resolved (Staff/Admin)
- `POST /api/complaints/:id/close` - Confirm & rate feedback (Complainant/Admin)
- `POST /api/complaints/:id/reopen` - Reopen unsatisfied resolution (Complainant)
- `GET /api/notifications` - In-app notification center
- `GET /api/analytics/dashboard` - Real-time KPI summaries & category breakdown
- `GET /api/sla` - SLA threshold definitions & overdue monitor
- `GET /api/reports/export-csv` - Downloadable institutional CSV report
