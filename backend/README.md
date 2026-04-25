# RUET OBE Evaluation System — Backend API

The REST API server powering the RUET OBE Evaluation System. Built with **Express 5** and **Mongoose 9**, secured with **JWT** and **Firebase Admin SDK**.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Express](https://expressjs.com) | 5 | Web framework |
| [Mongoose](https://mongoosejs.com) | 9 | MongoDB ODM |
| [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) | 13 | Server-side identity verification |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9 | JWT generation & verification |
| [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) | 3 | Password hashing |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 8 | Login brute-force protection |
| [cors](https://github.com/expressjs/cors) | 2 | Cross-origin resource sharing |
| [dotenv](https://github.com/motdotla/dotenv) | 17 | Environment variable loading |
| [nodemon](https://nodemon.io) | 3 | Dev server with auto-restart |

---

## Project Structure

```
backend/
├── server.js              # Application entry point
├── package.json
├── .env.example           # Environment variable template
│
├── config/
│   └── firebase.js        # Firebase Admin SDK initialisation
│
├── middleware/
│   └── authMiddleware.js  # JWT verification & role extraction
│
├── models/                # Mongoose schemas
│   ├── Assessment.js      # Theory & sessional assessments with CO-wise marks
│   ├── ClassInstance.js    # Course offering per semester/section/teacher
│   ├── Course.js          # Course catalogue entry
│   ├── CourseAdvisor.js   # Course advisor assignments
│   ├── Department.js      # University department
│   ├── Enrollment.js      # Student-to-class enrollment with marks & attendance
│   ├── Feedback.js        # Student course feedback submissions
│   ├── InstructorReport.js# Teacher self-assessment reports
│   ├── Notice.js          # Department/course notices
│   ├── NoticeRead.js      # Per-user notice read tracking
│   ├── SectionCR.js       # Section class representative assignments
│   ├── Series.js          # Academic batch/series definitions
│   └── User.js            # Users (all 4 roles in a single collection)
│
├── routes/                # Express router modules
│   ├── authRoutes.js          # POST /api/auth/login, POST /api/auth/register
│   ├── departmentRoutes.js    # CRUD /api/departments
│   ├── courseRoutes.js        # CRUD /api/courses
│   ├── userRoutes.js          # CRUD /api/users (admin-managed accounts)
│   ├── classInstanceRoutes.js # CRUD /api/class-instances
│   ├── assessmentRoutes.js    # CRUD /api/assessments
│   ├── enrollmentRoutes.js    # CRUD /api/enrollments
│   ├── dashboardRoutes.js     # GET  /api/dashboard (role-specific stats)
│   ├── feedbackRoutes.js      # CRUD /api/feedback
│   ├── instructorReportRoutes.js # CRUD /api/instructor-reports
│   ├── seriesRoutes.js        # CRUD /api/series
│   ├── noticeRoutes.js        # CRUD /api/notices
│   └── courseAdvisorRoutes.js # CRUD /api/course-advisors
│
├── services/              # Business logic layer
│   ├── analyticsService.js    # OBE analytics, CO/PO attainment calculations
│   ├── obeEngine.js           # Core OBE computation engine
│   ├── notificationService.js # Notice/notification delivery
│   ├── attendanceHelpers.js   # Attendance percentage & summary logic
│   ├── gradingHelpers.js      # Letter-grade boundaries & GPA mapping
│   └── teacherHelpers.js      # Teacher workload & assignment helpers
│
├── utils/                 # Shared utilities
│   ├── routeHelpers.js        # Common route handler wrappers
│   ├── classInstanceUtils.js  # Class instance query helpers
│   └── departmentRules.js     # Department-specific validation rules
│
├── seed.js                # Main database seeder (departments, admins, teachers, courses, students)
├── seed_courses.js        # Course-only seeder
└── seed_teachers.js       # Teacher-only seeder
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server (`node server.js`) |
| `npm run dev` | Start the dev server with auto-restart (`nodemon server.js`) |
| `npm run seed` | Seed the database with departments, admins, teachers, courses, and students |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `PORT` | ❌ | Server port (default: `5000`) | `5000` |
| `MONGO_URI` | ✅ | MongoDB connection string | `mongodb://127.0.0.1:27017/ruet-obe` |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs — use a strong random string | `a7f3...random...9c2d` |
| `FIREBASE_SERVICE_ACCOUNT` | ⚠️ | Base64-encoded Firebase service account JSON (production) | `eyJ0eXBlIjoi...` |
| `FIREBASE_PROJECT_ID` | ⚠️ | Firebase project ID (alternative to service account for GCP) | `your-firebase-project` |
| `ALLOWED_ORIGINS` | ❌ | Comma-separated CORS whitelist (defaults to localhost + Netlify) | `https://obe-webapp-demo.netlify.app,http://localhost:5173` |

> ⚠️ At least one of `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID` is required for Firebase Admin SDK initialisation in production.

---

## API Routes

All routes are prefixed with `/api`.

| Route Prefix | Module | Key Endpoints |
|-------------|--------|---------------|
| `/api/auth` | `authRoutes` | `POST /login` — authenticate & receive JWT |
| `/api/departments` | `departmentRoutes` | `GET /` — list all, `POST /` — create, `GET /:id`, `PUT /:id` |
| `/api/courses` | `courseRoutes` | `GET /` — list (filter by dept/semester), `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/users` | `userRoutes` | `GET /` — list (filter by role/dept), `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/class-instances` | `classInstanceRoutes` | `GET /` — list, `POST /` — create offering, `PUT /:id`, `DELETE /:id` |
| `/api/assessments` | `assessmentRoutes` | `GET /` — list, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/enrollments` | `enrollmentRoutes` | `GET /` — list, `POST /` — enroll, `PUT /:id` — update marks/attendance |
| `/api/dashboard` | `dashboardRoutes` | `GET /` — role-specific aggregated stats |
| `/api/feedback` | `feedbackRoutes` | `GET /` — list, `POST /` — submit, analytics endpoints |
| `/api/instructor-reports` | `instructorReportRoutes` | `GET /`, `POST /`, `PUT /:id` |
| `/api/series` | `seriesRoutes` | `GET /`, `POST /`, `DELETE /:id` |
| `/api/notices` | `noticeRoutes` | `GET /` — list, `POST /` — publish, `PUT /:id`, `DELETE /:id`, read tracking |
| `/api/course-advisors` | `courseAdvisorRoutes` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |

---

## Data Models

| Model | Collection | Description |
|-------|-----------|-------------|
| `User` | `users` | All user accounts — Central Admin, Dept Admin, Teacher, Student — with role-specific fields (rollNumber, designation, teacherType, onLeave, isCR, series, section) |
| `Department` | `departments` | University departments with section configuration |
| `Course` | `courses` | Course catalogue with code, name, credit, type, semester, syllabus |
| `ClassInstance` | `classinstances` | A specific course offering (teacher + semester + section + year) |
| `Assessment` | `assessments` | Assessment definitions with CO-wise mark distribution |
| `Enrollment` | `enrollments` | Student ↔ ClassInstance link with marks and attendance data |
| `Feedback` | `feedbacks` | Student-submitted course feedback responses |
| `InstructorReport` | `instructorreports` | Teacher self-assessment teaching reports |
| `Notice` | `notices` | Published notices (department-wide or course-specific) |
| `NoticeRead` | `noticereads` | Tracks which users have read each notice |
| `SectionCR` | `sectioncrs` | Section class representative assignments |
| `Series` | `series` | Academic batch/series definitions |
| `CourseAdvisor` | `courseadvisors` | Course advisor ↔ course ↔ series assignments |

---

## Authentication & Security

### Authentication Flow

1. Client authenticates via **Firebase Authentication** (email/password)
2. Client sends the Firebase **ID token** to `POST /api/auth/login`
3. Backend verifies the token with **Firebase Admin SDK**, looks up the user in MongoDB
4. Backend issues a **JWT** containing `userId`, `role`, and `department`
5. Client includes `Authorization: Bearer <jwt>` on all subsequent requests
6. `authMiddleware.js` verifies the JWT and attaches `req.user` for downstream routes

### Security Features

| Feature | Detail |
|---------|--------|
| **Password Hashing** | bcryptjs with 10 salt rounds (automatic on save via Mongoose pre-hook) |
| **Rate Limiting** | Login endpoint: max 10 failed attempts per 15 minutes |
| **CORS** | Origin whitelist from `ALLOWED_ORIGINS` env var; rejects unlisted origins with 403 |
| **Global Error Handler** | Catches all errors; never leaks stack traces to clients in production |
| **Input Validation** | Request body validated at route level before database operations |
| **Role-Based Access** | Middleware enforces role checks per route (`CENTRAL_ADMIN`, `DEPT_ADMIN`, `TEACHER`, `STUDENT`) |

---

## Database Seeding

The seed script (`npm run seed`) populates a fresh database with realistic data:

```bash
npm run seed
```

**What it creates:**

| Data | Source | Count |
|------|--------|-------|
| Departments | Hardcoded in `seed.js` | 20 (all RUET departments) |
| Central Admin | Hardcoded | 1 (`admin@obe.ruet.ac.bd`) |
| Dept Admins | Auto-generated per department | 20 |
| Teachers | `ruet_teachers.json` | ~500+ (real RUET faculty) |
| ECE Courses | `ece-courses.json` | ~80+ courses |
| ECE 2023 Students | `RUET_ECE_2023_students.csv` | ~60 students |

> ⚠️ **Warning:** `npm run seed` **clears all existing data** before seeding. Do not run in production with live data.

**Default password for all seeded accounts:** `123456`

Additional seeders:
- `node seed_courses.js` — seed courses only
- `node seed_teachers.js` — seed teachers only

---

## Deployment

### Render

1. Create a new **Web Service** → connect your repo → set root directory to `backend/`
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. Add environment variables in the Render dashboard
5. Use a **MongoDB Atlas** cluster for the `MONGO_URI`

### Railway

1. Create a new project → connect repo → set root to `backend/`
2. Railway auto-detects Node.js — set start command to `npm start`
3. Add environment variables in the Railway dashboard
4. Attach a MongoDB plugin or use Atlas

### Health Check

```bash
curl https://your-backend-url.com/
# Response: "RUET OBE Evaluation System API"
```

---

## Related

- [Frontend README](../frontend/README.md) — React SPA documentation
- [Root README](../README.md) — Full project overview & quick start
