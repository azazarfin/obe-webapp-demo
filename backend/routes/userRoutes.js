const express = require('express');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;

    const users = await User.find(filter)
      .populate('department', 'name shortName')
      .select('-password -__v')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name shortName')
      .select('-password -__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const { name, email, role, department, rollNumber, designation, series, section, password } = req.body;
    const user = await User.create({
      name, email, role, department, rollNumber, designation, series, section,
      password: password || '123456'
    });
    const populated = await user.populate('department', 'name shortName');
    const { password: _, ...userData } = populated.toObject();
    res.status(201).json(userData);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

router.post('/bulk', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students array is required' });
    }

    const created = [];
    const errors = [];

    for (const student of students) {
      try {
        const user = await User.create({
          name: student.name || `Student ${student.rollNumber}`,
          email: student.email,
          role: 'STUDENT',
          department: student.department,
          rollNumber: student.rollNumber,
          series: student.series,
          section: student.section,
          password: '123456'
        });
        created.push({ rollNumber: user.rollNumber, email: user.email });
      } catch (err) {
        errors.push({ rollNumber: student.rollNumber, error: err.message });
      }
    }

    res.status(201).json({ created: created.length, errors: errors.length, details: { created, errors } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during bulk creation' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.password;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('department', 'name shortName')
      .select('-password -__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating user' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
