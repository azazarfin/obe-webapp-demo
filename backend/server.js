const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const classInstanceRoutes = require('./routes/classInstanceRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('RUET OBE Evaluation System API');
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/class-instances', classInstanceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
