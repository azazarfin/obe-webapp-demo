const express = require('express');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.classInstance) filter.classInstance = req.query.classInstance;

    const enrollments = await Enrollment.find(filter)
      .populate('student', 'name email rollNumber')
      .populate({
        path: 'classInstance',
        populate: [
          { path: 'course', select: 'courseCode courseName type credit' },
          { path: 'teacher', select: 'name email' }
        ]
      })
      .populate('marks.assessment', 'title type totalMarks mappedCO');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching enrollments' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const enrollment = await Enrollment.create(req.body);
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating enrollment' });
  }
});

router.post('/:id/attendance', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    const results = [];
    for (const record of records) {
      const enrollment = await Enrollment.findOne({
        student: record.studentId,
        classInstance: req.params.id
      });

      if (enrollment) {
        const existingRecord = enrollment.attendanceRecord.find(
          r => new Date(r.date).toDateString() === new Date(date).toDateString()
        );

        if (existingRecord) {
          existingRecord.status = record.status;
        } else {
          enrollment.attendanceRecord.push({ date: new Date(date), status: record.status });
        }
        await enrollment.save();
        results.push({ studentId: record.studentId, status: 'saved' });
      } else {
        results.push({ studentId: record.studentId, status: 'enrollment_not_found' });
      }
    }

    res.json({ message: 'Attendance recorded', results });
  } catch (error) {
    res.status(500).json({ error: 'Server error recording attendance' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ message: 'Enrollment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting enrollment' });
  }
});

module.exports = router;
