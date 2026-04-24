const express = require('express');
const Assessment = require('../models/Assessment');
const ClassInstance = require('../models/ClassInstance');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getAssignedTeacherIds } = require('../utils/classInstanceUtils');
const { createAutoNotice } = require('../services/notificationService');

const router = express.Router();

router.get('/:classInstanceId', verifyToken, async (req, res) => {
  try {
    const assessments = await Assessment.find({ classInstance: req.params.classInstanceId })
      .populate('createdBy', 'name email')
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
      questionNo: req.body.questionNo,
      createdBy: req.user.id
    };

    const assessment = await Assessment.create(payload);

    // Auto-notification: inform enrolled students about the new assessment
    const courseName = classInstance.course?.courseCode || 'the course';
    createAutoNotice({
      title: `New Assessment: ${assessment.title}`,
      body: `A new ${assessment.type} "${assessment.title}" has been added to ${courseName}.`,
      author: req.user.id,
      scope: 'COURSE',
      classInstance: classInstance._id,
      type: 'ASSESSMENT',
      relatedEntity: assessment._id
    });

    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating assessment' });
  }
});

router.put('/:id', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const allowedFields = ['title', 'type', 'totalMarks', 'mappedCO', 'mappedPOs',
                           'typeLabel', 'assessmentDate', 'finalPart', 'questionNo'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
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
    const assessmentId = req.params.id;

    // Build bulk operations: update existing marks, push new ones
    const bulkOps = marks.flatMap((entry) => [
      // If this assessment already exists in the marks array, update in place
      {
        updateOne: {
          filter: {
            student: entry.studentId,
            classInstance: classInstanceId,
            'marks.assessment': assessmentId
          },
          update: { $set: { 'marks.$.rawScore': entry.rawScore } }
        }
      },
      // If this assessment does NOT exist in the marks array, push it
      {
        updateOne: {
          filter: {
            student: entry.studentId,
            classInstance: classInstanceId,
            'marks.assessment': { $ne: assessmentId }
          },
          update: { $push: { marks: { assessment: assessmentId, rawScore: entry.rawScore } } }
        }
      }
    ]);

    await Enrollment.bulkWrite(bulkOps, { ordered: false });

    const results = marks.map((entry) => ({ studentId: entry.studentId, status: 'saved' }));
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
