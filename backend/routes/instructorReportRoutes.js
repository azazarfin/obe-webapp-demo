const express = require('express');
const InstructorReport = require('../models/InstructorReport');
const ClassInstance = require('../models/ClassInstance');
const Course = require('../models/Course');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getAssignedTeacherIds } = require('../utils/classInstanceUtils');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};

    if (req.query.classInstance) {
      filter.classInstance = req.query.classInstance;
    }

    if (req.query.department) {
      const courseIds = await Course.find({ department: req.query.department }).distinct('_id');
      const classInstanceIds = await ClassInstance.find({ course: { $in: courseIds } }).distinct('_id');
      filter.classInstance = { $in: classInstanceIds };
    }

    const reports = await InstructorReport.find(filter)
      .populate({
        path: 'classInstance',
        populate: [
          {
            path: 'course',
            populate: { path: 'department', select: 'name shortName' }
          },
          { path: 'teacher', select: 'name email designation teacherType onLeave leaveReason' },
          { path: 'teachers', select: 'name email designation teacherType onLeave leaveReason' }
        ]
      })
      .populate('teacher', 'name email designation')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching instructor reports' });
  }
});

router.post('/', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const classInstance = await ClassInstance.findById(req.body.classInstance).populate('teachers', '_id');
    if (!classInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
    }

    if (!getAssignedTeacherIds(classInstance).includes(String(req.user.id))) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this class instance' });
    }

    const payload = {
      classInstance: classInstance._id,
      teacher: req.user.id,
      ratings: Array.isArray(req.body.ratings) ? req.body.ratings : [],
      courseOutcomes: Array.isArray(req.body.courseOutcomes) ? req.body.courseOutcomes : [],
      suggestions: {
        syllabus: req.body.suggestions?.syllabus || '',
        teaching: req.body.suggestions?.teaching || '',
        resources: req.body.suggestions?.resources || '',
        assessment: req.body.suggestions?.assessment || ''
      }
    };

    const report = await InstructorReport.findOneAndUpdate(
      { classInstance: classInstance._id, teacher: req.user.id },
      payload,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: 'Server error saving instructor report' });
  }
});

module.exports = router;
