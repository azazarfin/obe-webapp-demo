const express = require('express');
const Course = require('../models/Course');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.type) filter.type = req.query.type;

    const courses = await Course.find(filter)
      .populate('department', 'name shortName')
      .sort({ courseCode: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching courses' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('department', 'name shortName');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    const populated = await course.populate('department', 'name shortName');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: 'Server error creating course' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('department', 'name shortName');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating course' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting course' });
  }
});

module.exports = router;
