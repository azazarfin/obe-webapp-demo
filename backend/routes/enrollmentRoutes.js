const express = require('express');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const populateEnrollment = (query) => query
  .populate('student', 'name email rollNumber series section')
  .populate({
    path: 'classInstance',
    populate: [
      { path: 'course', populate: { path: 'department', select: 'name shortName' } },
      { path: 'teacher', select: 'name email designation' }
    ]
  })
  .populate('marks.assessment');

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.classInstance) filter.classInstance = req.query.classInstance;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const enrollments = await populateEnrollment(Enrollment.find(filter)).sort({ createdAt: 1 });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching enrollments' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const existing = await Enrollment.findOne({
      student: req.body.student,
      classInstance: req.body.classInstance
    });

    if (existing) {
      existing.type = req.body.type || existing.type;
      existing.status = req.body.status || existing.status;
      await existing.save();
      const populated = await populateEnrollment(Enrollment.findById(existing._id));
      return res.json(populated);
    }

    const enrollment = await Enrollment.create(req.body);
    const populated = await populateEnrollment(Enrollment.findById(enrollment._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating enrollment' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const populated = await populateEnrollment(Enrollment.findById(enrollment._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating enrollment' });
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

        const normalizedStatus = record.status === 'A'
          ? 'Absent'
          : 'Present';

        if (existingRecord) {
          existingRecord.status = normalizedStatus;
        } else {
          enrollment.attendanceRecord.push({ date: new Date(date), status: normalizedStatus });
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
