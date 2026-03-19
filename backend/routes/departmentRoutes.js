const express = require('express');
const Department = require('../models/Department');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const departments = await Department.find().sort({ shortName: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching departments' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN'), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department already exists' });
    }
    res.status(500).json({ error: 'Server error creating department' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating department' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting department' });
  }
});

module.exports = router;
