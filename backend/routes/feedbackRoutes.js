const express = require('express');
const ClassInstance = require('../models/ClassInstance');
const Enrollment = require('../models/Enrollment');
const Feedback = require('../models/Feedback');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  DEFAULT_FEEDBACK_QUESTIONS,
  sanitizeFeedbackQuestions,
  syncRegularEnrollmentsForClassInstance
} = require('../services/analyticsService');

const router = express.Router();

router.get('/class/:classInstanceId', verifyToken, async (req, res) => {
  try {
    const classInstance = await ClassInstance.findById(req.params.classInstanceId);
    if (!classInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
    }

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

    const hasSubmitted = req.user.role === 'STUDENT'
      ? Boolean(await Feedback.findOne({ classInstance: classInstance._id, student: req.user.id }).select('_id'))
      : false;

    res.json({
      questions,
      published: Boolean(classInstance.feedbackPublished),
      participation,
      totalStudents,
      averages,
      hasSubmitted,
      canSubmit: Boolean(classInstance.feedbackPublished) && !hasSubmitted
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching feedback data' });
  }
});

router.put('/class/:classInstanceId/config', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const payload = {};

    if (Array.isArray(req.body.questions)) {
      payload.feedbackQuestions = sanitizeFeedbackQuestions(req.body.questions);
    }

    if (typeof req.body.published === 'boolean') {
      payload.feedbackPublished = req.body.published;
    }

    const classInstance = await ClassInstance.findByIdAndUpdate(
      req.params.classInstanceId,
      payload,
      { new: true, runValidators: true }
    );

    if (!classInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
    }

    res.json({
      questions: sanitizeFeedbackQuestions(classInstance.feedbackQuestions),
      published: Boolean(classInstance.feedbackPublished)
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating feedback configuration' });
  }
});

router.post('/class/:classInstanceId/submit', verifyToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const classInstance = await ClassInstance.findById(req.params.classInstanceId);
    if (!classInstance) {
      return res.status(404).json({ error: 'Class instance not found' });
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
      ratings: cleanedRatings
    });

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

module.exports = router;
