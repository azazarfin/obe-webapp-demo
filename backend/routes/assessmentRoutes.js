const express = require('express');
const Assessment = require('../models/Assessment');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:classInstanceId', verifyToken, async (req, res) => {
  try {
    const assessments = await Assessment.find({ classInstance: req.params.classInstanceId })
      .sort({ type: 1, title: 1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching assessments' });
  }
});

router.post('/', verifyToken, requireRole('TEACHER', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const assessment = await Assessment.create(req.body);
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating assessment' });
  }
});

router.put('/:id', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating assessment' });
  }
});

router.put('/:id/marks', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const { marks } = req.body;
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ error: 'Marks array is required' });
    }

    const results = [];
    for (const entry of marks) {
      const enrollment = await Enrollment.findOne({
        student: entry.studentId,
        classInstance: req.body.classInstanceId
      });

      if (enrollment) {
        const existingMark = enrollment.marks.find(m => m.assessment.toString() === req.params.id);
        if (existingMark) {
          existingMark.rawScore = entry.rawScore;
        } else {
          enrollment.marks.push({ assessment: req.params.id, rawScore: entry.rawScore });
        }
        await enrollment.save();
        results.push({ studentId: entry.studentId, status: 'saved' });
      } else {
        results.push({ studentId: entry.studentId, status: 'enrollment_not_found' });
      }
    }

    res.json({ message: 'Marks saved', results });
  } catch (error) {
    res.status(500).json({ error: 'Server error saving marks' });
  }
});

router.delete('/:id', verifyToken, requireRole('TEACHER', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting assessment' });
  }
});

module.exports = router;
