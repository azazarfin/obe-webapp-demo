const express = require('express');
const ClassInstance = require('../models/ClassInstance');
const Enrollment = require('../models/Enrollment');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  DEFAULT_FEEDBACK_QUESTIONS,
  sanitizeFeedbackQuestions,
  syncRegularEnrollmentsForClassInstance
} = require('../services/analyticsService');
const { createHttpError, idsEqual } = require('../utils/departmentRules');
const { getAssignedTeacherIds } = require('../utils/classInstanceUtils');
const { createAutoNotice } = require('../services/notificationService');

const router = express.Router();
const DEPARTMENT_SELECT = 'name shortName hasSections sectionCount';

const loadClassInstanceForAccess = async (classInstanceId) => {
  const classInstance = await ClassInstance.findById(classInstanceId)
    .populate({ path: 'course', populate: { path: 'department', select: DEPARTMENT_SELECT } })
    .populate('teacher', '_id')
    .populate('teachers', '_id');

  if (!classInstance) {
    throw createHttpError(404, 'Class instance not found');
  }

  return classInstance;
};

const ensureFeedbackAccess = async (req, classInstance, options = {}) => {
  const isWriteAction = Boolean(options.write);

  if (req.user.role === 'CENTRAL_ADMIN') {
    return;
  }

  if (req.user.role === 'DEPT_ADMIN') {
    const currentUser = await User.findById(req.user.id).populate('department', DEPARTMENT_SELECT);
    if (!currentUser) {
      throw createHttpError(401, 'User not found');
    }

    if (!idsEqual(classInstance.course?.department?._id || classInstance.course?.department, currentUser.department?._id || currentUser.department)) {
      throw createHttpError(403, 'Forbidden: This class instance is outside your department');
    }
    return;
  }

  if (req.user.role === 'TEACHER') {
    if (!getAssignedTeacherIds(classInstance).includes(String(req.user.id))) {
      throw createHttpError(403, 'Forbidden: You can only manage feedback for your assigned courses');
    }
    return;
  }

  if (req.user.role === 'STUDENT') {
    if (isWriteAction) {
      throw createHttpError(403, 'Forbidden: Insufficient permissions');
    }

    const enrollment = await Enrollment.findOne({
      classInstance: classInstance._id,
      student: req.user.id,
      status: { $ne: 'hidden' }
    }).select('_id');

    if (!enrollment) {
      throw createHttpError(403, 'Forbidden: You are not enrolled in this class instance');
    }
    return;
  }

  if (isWriteAction) {
    throw createHttpError(403, 'Forbidden: Insufficient permissions');
  }
};

router.get('/class/:classInstanceId', verifyToken, async (req, res) => {
  try {
    const classInstance = await loadClassInstanceForAccess(req.params.classInstanceId);
    await ensureFeedbackAccess(req, classInstance);
    await syncRegularEnrollmentsForClassInstance(classInstance);

    const [feedbacks, activeEnrollments] = await Promise.all([
      Feedback.find({ classInstance: classInstance._id }),
      Enrollment.find({ classInstance: classInstance._id, status: { $ne: 'hidden' } }).select('_id')
    ]);

    const questions = sanitizeFeedbackQuestions(classInstance.feedbackQuestions || DEFAULT_FEEDBACK_QUESTIONS);
    const totalStudents = activeEnrollments.length;
    const participation = feedbacks.length;
    const averages = questions.map((question) => {
      const scores = feedbacks
        .map((feedback) => feedback.ratings.find((rating) => rating.attribute === question)?.score)
        .filter((score) => typeof score === 'number');

      if (scores.length === 0) {
        return 0;
      }

      const total = scores.reduce((sum, score) => sum + score, 0);
      return Number((total / scores.length).toFixed(1));
    });

    const suggestions = feedbacks
      .map((f) => f.suggestions)
      .filter((s) => typeof s === 'string' && s.trim().length > 0);

    const hasSubmitted = req.user.role === 'STUDENT'
      ? Boolean(await Feedback.findOne({ classInstance: classInstance._id, student: req.user.id }).select('_id'))
      : false;

    res.json({
      suggestions,
      questions,
      published: Boolean(classInstance.feedbackPublished),
      participation,
      totalStudents,
      averages,
      hasSubmitted,
      canSubmit: Boolean(classInstance.feedbackPublished) && !hasSubmitted
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching feedback data' });
  }
});

router.get('/class/:classInstanceId/export-data', verifyToken, async (req, res) => {
  try {
    const classInstance = await loadClassInstanceForAccess(req.params.classInstanceId);
    await ensureFeedbackAccess(req, classInstance);

    const feedbacks = await Feedback.find({ classInstance: classInstance._id }).sort({ createdAt: 1 });
    
    const questions = sanitizeFeedbackQuestions();

    const data = feedbacks.map((f) => ({
      id: f._id,
      timestamp: f.createdAt,
      ratings: f.ratings.map((r) => ({ attribute: r.attribute, score: r.score })),
      suggestions: f.suggestions
    }));

    res.json({
      questions,
      feedbacks: data
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching export data' });
  }
});

router.put('/class/:classInstanceId/config', verifyToken, async (req, res) => {
  try {
    const classInstance = await loadClassInstanceForAccess(req.params.classInstanceId);
    await ensureFeedbackAccess(req, classInstance, { write: true });

    const payload = {};

    // Custom questions are no longer editable, ignore req.body.questions

    if (typeof req.body.published === 'boolean') {
      payload.feedbackPublished = req.body.published;
    }

    const updatedClassInstance = await ClassInstance.findByIdAndUpdate(
      req.params.classInstanceId,
      payload,
      { new: true, runValidators: true }
    );

    if (!updatedClassInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
    }

    // Auto-notification: inform students about feedback form state changes
    if (typeof req.body.published === 'boolean') {
      const courseName = classInstance.course?.courseCode || 'the course';
      if (req.body.published) {
        createAutoNotice({
          title: `Feedback Form Open: ${courseName}`,
          body: `The course feedback form for ${courseName} is now open. Please submit your feedback.`,
          author: req.user.id,
          scope: 'COURSE',
          classInstance: classInstance._id,
          type: 'FEEDBACK_OPEN',
          relatedEntity: classInstance._id
        });
      } else {
        createAutoNotice({
          title: `Feedback Form Closed: ${courseName}`,
          body: `The course feedback form for ${courseName} has been closed.`,
          author: req.user.id,
          scope: 'COURSE',
          classInstance: classInstance._id,
          type: 'FEEDBACK_CLOSE',
          relatedEntity: classInstance._id
        });
      }
    }

    res.json({
      questions: sanitizeFeedbackQuestions(updatedClassInstance.feedbackQuestions),
      published: Boolean(updatedClassInstance.feedbackPublished)
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error updating feedback configuration' });
  }
});

router.post('/class/:classInstanceId/submit', verifyToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const classInstance = await ClassInstance.findById(req.params.classInstanceId);
    if (!classInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
    }

    const enrollment = await Enrollment.findOne({
      classInstance: classInstance._id,
      student: req.user.id,
      status: { $ne: 'hidden' }
    }).select('_id');

    if (!enrollment) {
      return res.status(403).json({ error: 'Forbidden: You are not enrolled in this class instance' });
    }

    if (!classInstance.feedbackPublished) {
      return res.status(400).json({ error: 'Feedback form is currently closed' });
    }

    const existing = await Feedback.findOne({
      classInstance: classInstance._id,
      student: req.user.id
    });

    if (existing) {
      return res.status(400).json({ error: 'Feedback has already been submitted for this course' });
    }

    const ratings = Array.isArray(req.body.ratings) ? req.body.ratings : [];
    if (ratings.length === 0) {
      return res.status(400).json({ error: 'Ratings are required' });
    }

    const cleanedRatings = ratings.map((rating) => ({
      attribute: String(rating.attribute || '').trim(),
      score: Number(rating.score)
    })).filter((rating) => rating.attribute && rating.score >= 1 && rating.score <= 5);

    if (cleanedRatings.length === 0) {
      return res.status(400).json({ error: 'Valid ratings are required' });
    }

    await Feedback.create({
      classInstance: classInstance._id,
      student: req.user.id,
      ratings: cleanedRatings,
      suggestions: String(req.body.suggestions || '').trim()
    });

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

module.exports = router;
