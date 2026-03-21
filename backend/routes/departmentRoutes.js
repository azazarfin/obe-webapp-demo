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
    const payload = {
      name: req.body.name,
      shortName: req.body.shortName,
      establishedYear: req.body.establishedYear,
      introduction: req.body.introduction,
      hasSections: req.body.hasSections,
      sectionCount: req.body.sectionCount
    };
    const dept = await Department.create(payload);
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
    const payload = {};
    if (req.body.name !== undefined) payload.name = req.body.name;
    if (req.body.shortName !== undefined) payload.shortName = req.body.shortName;
    if (req.body.establishedYear !== undefined) payload.establishedYear = req.body.establishedYear;
    if (req.body.introduction !== undefined) payload.introduction = req.body.introduction;
    if (req.body.hasSections !== undefined) payload.hasSections = req.body.hasSections;
    if (req.body.sectionCount !== undefined) payload.sectionCount = req.body.sectionCount;
    const dept = await Department.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
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
