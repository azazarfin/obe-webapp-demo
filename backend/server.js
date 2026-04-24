const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const classInstanceRoutes = require('./routes/classInstanceRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const instructorReportRoutes = require('./routes/instructorReportRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const courseAdvisorRoutes = require('./routes/courseAdvisorRoutes');
const app = express();

const defaultAllowedOrigins = [
  'https://obe-webapp-demo.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : defaultAllowedOrigins
)
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsErrorMessage = 'The CORS policy for this site does not allow access from the specified Origin.';

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      return callback(new Error(corsErrorMessage));
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many failed login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('RUET OBE Evaluation System API');
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/class-instances', classInstanceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/instructor-reports', instructorReportRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/course-advisors', courseAdvisorRoutes);
// ─── Global Error Handler ───────────────────────────────────────
// Catches CORS errors, route errors via next(err), and any unhandled middleware failures.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // CORS rejection
  if (err.message === corsErrorMessage) {
    return res.status(403).json({ error: corsErrorMessage });
  }

  const status = err.status || 500;
  const isServerError = status >= 500;

  // Always log server-side for observability
  if (isServerError) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Never leak internal details to the client in production
  const message = isServerError
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  return res.status(status).json({ error: message });
});

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
