const express = require('express');
const ClassInstance = require('../models/ClassInstance');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.series) filter.series = parseInt(req.query.series);

    const instances = await ClassInstance.find(filter)
      .populate({ path: 'course', populate: { path: 'department', select: 'name shortName' } })
      .populate('teacher', 'name email designation')
      .sort({ createdAt: -1 });
    res.json(instances);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching class instances' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const instance = await ClassInstance.create(req.body);
    const populated = await instance.populate([
      { path: 'course', populate: { path: 'department', select: 'name shortName' } },
      { path: 'teacher', select: 'name email designation' }
    ]);
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create class instance error:', error);
    res.status(500).json({ error: 'Server error creating class instance' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const instance = await ClassInstance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path: 'course', populate: { path: 'department', select: 'name shortName' } })
      .populate('teacher', 'name email designation');
    if (!instance) return res.status(404).json({ error: 'Class instance not found' });
    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating class instance' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const instance = await ClassInstance.findByIdAndDelete(req.params.id);
    if (!instance) return res.status(404).json({ error: 'Class instance not found' });
    res.json({ message: 'Class instance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting class instance' });
  }
});

module.exports = router;
