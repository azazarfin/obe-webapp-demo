# RUET OBE Evaluation System — Frontend

The single-page application powering the RUET OBE Evaluation System. Built with **React 19**, bundled by **Vite 6**, and styled with **Tailwind CSS 4**.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [React](https://react.dev) | 19 | UI library |
| [Vite](https://vite.dev) | 6 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first CSS framework |
| [Redux Toolkit](https://redux-toolkit.js.org) | 2.x | State management |
| [React Router](https://reactrouter.com) | 7 | Client-side routing |
| [Firebase SDK](https://firebase.google.com) | 12 | Client-side authentication |
| [Lucide React](https://lucide.dev) | 0.577+ | Icon library |
| [ExcelJS](https://github.com/exceljs/exceljs) / [xlsx](https://sheetjs.com) | — | Excel file generation |
| [jsPDF](https://github.com/parallax/jsPDF) | 4 | PDF report generation |

---

## Project Structure

```
frontend/
├── public/
│   ├── _redirects            # Netlify SPA routing rule
│   ├── favicon.svg           # App favicon
│   ├── logo.png              # RUET logo
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker for offline caching
│   └── icons/                # PWA icons (192×192, 512×512)
│
├── src/
│   ├── App.jsx               # Root component with route definitions
│   ├── main.jsx              # Entry point (React DOM + Redux Provider)
│   ├── index.css             # Global styles
│   ├── App.css               # App-level styles
│   │
│   ├── components/           # Shared, reusable components
│   │   ├── Layout.jsx        # Authenticated layout shell (sidebar + outlet)
│   │   ├── Sidebar.jsx       # Role-aware navigation sidebar
│   │   ├── ProtectedRoute.jsx# Route guard with role-based access control
│   │   ├── ConfirmDialog.jsx # Reusable confirmation modal
│   │   ├── NotificationDropdown.jsx  # Notice bell dropdown
│   │   └── SeriesSelectField.jsx     # Shared series/year picker
│   │
│   ├── config/
│   │   ├── firebase.js       # Firebase client SDK initialisation
│   │   └── apiConfig.js      # Axios/fetch base URL configuration
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Authentication state & user info
│   │   ├── ThemeContext.jsx  # Dark/light mode toggle
│   │   └── SidebarContext.jsx# Sidebar open/collapse state
│   │
│   ├── hooks/
│   │   └── useHistoryBackedState.js  # URL-synced state hook
│   │
│   ├── pages/
│   │   ├── Login.jsx                 # Login page (Firebase email/password)
│   │   ├── dashboards/               # Role-specific dashboard shells
│   │   ├── admin/                    # Central Admin pages
│   │   ├── dept-admin/               # Department Admin pages
│   │   ├── teacher/                  # Teacher pages
│   │   ├── student/                  # Student pages
│   │   └── notices/                  # Notice board pages
│   │
│   ├── store/
│   │   ├── store.js          # Redux store configuration
│   │   ├── api/
│   │   │   └── baseApi.js    # RTK Query base API definition
│   │   └── slices/           # Redux state slices
│   │       ├── authSlice.js
│   │       ├── assessmentSlice.js
│   │       ├── classInstanceSlice.js
│   │       ├── courseAdvisorSlice.js
│   │       ├── dashboardSlice.js
│   │       ├── enrollmentSlice.js
│   │       ├── feedbackAnalyticsSlice.js
│   │       ├── instructorReportSlice.js
│   │       └── noticeSlice.js
│   │
│   └── utils/
│       ├── api.js                    # Axios instance with auth interceptor
│       ├── attendanceUtils.js        # Attendance calculation helpers
│       ├── departmentUtils.js        # Department name/code helpers
│       ├── excelExport.js            # Excel workbook generation
│       ├── exportUtils.js            # Generic export helpers
│       ├── gradeUtils.js             # Letter-grade mapping utilities
│       ├── semesterUtils.js          # Semester formatting
│       ├── seriesUtils.js            # Batch/series helpers
│       └── teacherReportExportUtils.js  # Instructor report PDF/Excel export
│
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── eslint.config.js          # ESLint flat config
├── package.json
└── .env.example              # Environment variable template
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR (`http://localhost:5173`) |
| `npm run build` | Production build → `dist/` directory |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project identifier | `your-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase application ID | `1:123456:web:abc123` |
| `VITE_API_URL` | ✅ | Backend API base URL | `http://localhost:5000/api` |

> **Note:** All `VITE_*` variables are embedded at build time and exposed to the browser. Never put secrets here.

---

## Role-Based Pages

### Central Admin (`/central-admin`)

| Page | Description |
|------|-------------|
| `CentralDashboardOverview` | University-wide statistics & overview |
| `DepartmentInfo` | View & manage departments |
| `TeacherInfo` | Browse & manage teacher accounts |
| `StudentManagementPanel` | Student CRUD, bulk import, series management |
| `DeptCourseManagement` | University-wide course catalogue |
| `DeptAddCourse` | Add courses to a department |
| `CourseInfo` | Detailed course view |
| `CourseReviewHub` | Aggregated feedback analytics |
| `SeriesManagement` | Manage academic series/batches |

### Department Admin (`/dept-admin`)

| Page | Description |
|------|-------------|
| `ManageCourseAdvisors` | Assign and manage course advisors |
| `CourseReviewHub` | Department-level feedback analytics |
| Notice pages | Department-level notice management |

### Teacher (`/teacher`)

| Page | Description |
|------|-------------|
| `TeacherCoursePage` | Course overview with enrolled students |
| `AddAssessment` / `AddSessionalAssessment` | Create theory/sessional assessments |
| `ManageAssessments` | View, edit, delete assessments |
| `ManageCOs` | CRUD Course Outcomes & PO mapping |
| `SemesterFinalMarking` | Final grading & mark entry |
| `TakeAttendance` | Record class attendance |
| `EvaluationReport` | OBE attainment evaluation report |
| `InstructorExperienceReport` | Teaching self-assessment report |
| `ManageCourseFeedback` | View student feedback |
| `ManageSectionCRs` | Assign section CRs |
| `ModifyStudentRoster` | Edit enrolled students |

### Student (`/student`)

| Page | Description |
|------|-------------|
| `StudentCoursePage` | Enrolled course details |
| `StudentMarksheet` | View marks & grades |
| `StudentOBEAttainment` | Personal CO/PO attainment view |
| `StudentAttendanceInfo` | Attendance summary |
| `StudentFeedback` | Submit course feedback |
| `UniversityDirectory` | Browse teachers & departments |

---

## State Management

The app uses **Redux Toolkit** for global state and **RTK Query** for server-state caching.

### Redux Slices

| Slice | Purpose |
|-------|---------|
| `authSlice` | JWT token, user role, login state |
| `assessmentSlice` | Assessment CRUD operations |
| `classInstanceSlice` | Class instance management |
| `courseAdvisorSlice` | Course advisor assignments |
| `dashboardSlice` | Dashboard summary data |
| `enrollmentSlice` | Student enrollment state |
| `feedbackAnalyticsSlice` | Feedback analytics cache |
| `instructorReportSlice` | Instructor report state |
| `noticeSlice` | Notice board state |

### RTK Query

A single `baseApi` slice in `store/api/baseApi.js` configures the base URL and default headers for all API calls.

---

## Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext` | Provides `currentUser`, `userRole`, `loading`, and `logout` to the entire app |
| `ThemeContext` | Manages dark/light mode preference (persisted to `localStorage`) |
| `SidebarContext` | Controls sidebar open/collapsed state |

---

## Build & Deploy

### Production Build

```bash
npm run build
```

This outputs optimized static files to `dist/`.

### Deploy to Netlify

1. **Build command:** `npm run build`
2. **Publish directory:** `dist`
3. SPA routing is handled by [`public/_redirects`](public/_redirects) (`/* /index.html 200`)
4. Set all `VITE_*` environment variables in the Netlify dashboard

---

## PWA Support

The app is installable as a Progressive Web App:

- **`public/manifest.json`** — defines app name, icons, theme colour, and display mode
- **`public/sw.js`** — service worker for basic offline caching
- **`public/icons/`** — PWA icons in multiple sizes

---

## Related

- [Backend README](../backend/README.md) — API server documentation
- [Root README](../README.md) — Full project overview & quick start
