const express = require('express');
const Assessment = require('../models/Assessment');
const ClassInstance = require('../models/ClassInstance');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getAssignedTeacherIds } = require('../utils/classInstanceUtils');

const router = express.Router();

router.get('/:classInstanceId', verifyToken, async (req, res) => {
  try {
    const assessments = await Assessment.find({ classInstance: req.params.classInstanceId })
      .sort({ finalPart: 1, questionNo: 1, type: 1, title: 1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching assessments' });
  }
});

router.post('/', verifyToken, requireRole('TEACHER', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const classInstance = await ClassInstance.findById(req.body.classInstance).populate('teachers', '_id');
    if (!classInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
    }

    if (req.user.role === 'TEACHER' && !getAssignedTeacherIds(classInstance).includes(String(req.user.id))) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this class instance' });
    }

    const totalMarks = Number(req.body.totalMarks);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      return res.status(400).json({ error: 'Total marks must be a positive number' });
    }

    const payload = {
      classInstance: classInstance._id,
      title: req.body.title,
      type: req.body.type,
      totalMarks,
      mappedCO: req.body.mappedCO,
      mappedPOs: req.body.mappedPOs,
      typeLabel: req.body.typeLabel,
      assessmentDate: req.body.assessmentDate,
      finalPart: req.body.finalPart,
      questionNo: req.body.questionNo
    };

    const assessment = await Assessment.create(payload);
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

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const classInstanceId = req.body.classInstanceId || assessment.classInstance?.toString();

    const results = [];
    for (const entry of marks) {
      const enrollment = await Enrollment.findOne({
        student: entry.studentId,
        classInstance: classInstanceId
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

    await Enrollment.updateMany(
      { 'marks.assessment': req.params.id },
      { $pull: { marks: { assessment: req.params.id } } }
    );

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting assessment' });
  }
});

module.exports = router;
