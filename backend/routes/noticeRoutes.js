const express = require('express');
const Notice = require('../models/Notice');
const User = require('../models/User');
const ClassInstance = require('../models/ClassInstance');
const Enrollment = require('../models/Enrollment');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  createNotice,
  getNoticesForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../services/notificationService');
const { getAssignedTeacherIds } = require('../utils/classInstanceUtils');

const router = express.Router();

// ─── Helpers ───────────────────────────────────────────────────

const getUserDepartmentId = async (userId) => {
  const user = await User.findById(userId).select('department');
  return user?.department || null;
};

/**
 * Validate that the caller has permission to create a notice with the given scope.
 */
const validateCreatePermission = async (req) => {
  const { scope, department, classInstance: classInstanceId } = req.body;
  const { role, id: userId } = req.user;

  if (role === 'CENTRAL_ADMIN') {
    // Can create ALL or DEPARTMENT (any) or COURSE (any)
    return;
  }

  if (role === 'DEPT_ADMIN') {
    const userDeptId = await getUserDepartmentId(userId);
    if (scope === 'ALL') {
      throw Object.assign(new Error('Dept admins cannot create system-wide notices'), { status: 403 });
    }
    if (scope === 'DEPARTMENT') {
      if (department && String(department) !== String(userDeptId)) {
        throw Object.assign(new Error('You can only create notices for your own department'), { status: 403 });
      }
    }
    if (scope === 'COURSE' && classInstanceId) {
      const ci = await ClassInstance.findById(classInstanceId).populate('course', 'department');
      if (!ci || String(ci.course?.department) !== String(userDeptId)) {
        throw Object.assign(new Error('You can only create notices for courses in your department'), { status: 403 });
      }
    }
    return;
  }

  if (role === 'TEACHER') {
    if (scope !== 'COURSE') {
      throw Object.assign(new Error('Teachers can only create course-scoped notices'), { status: 403 });
    }
    if (!classInstanceId) {
      throw Object.assign(new Error('Class instance is required for course-scoped notices'), { status: 400 });
    }
    const ci = await ClassInstance.findById(classInstanceId).populate('teachers', '_id');
    if (!ci || !getAssignedTeacherIds(ci).includes(String(userId))) {
      throw Object.assign(new Error('You are not assigned to this class instance'), { status: 403 });
    }
    return;
  }

  if (role === 'STUDENT') {
    // Only CRs can create notices
    const user = await User.findById(userId).select('isCR');
    if (!user?.isCR) {
      throw Object.assign(new Error('Only class representatives can create notices'), { status: 403 });
    }
    if (scope !== 'COURSE') {
      throw Object.assign(new Error('Class representatives can only create course-scoped notices'), { status: 403 });
    }
    if (!classInstanceId) {
      throw Object.assign(new Error('Class instance is required for course-scoped notices'), { status: 400 });
    }
    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: userId,
      classInstance: classInstanceId,
      status: { $ne: 'hidden' }
    }).select('_id');
    if (!enrollment) {
      throw Object.assign(new Error('You are not enrolled in this class instance'), { status: 403 });
    }
    return;
  }

  throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
};

// ─── Routes ────────────────────────────────────────────────────

/**
 * GET /api/notices
 * List notices for the current user (paginated).
 * Query params: page, limit, scope, type, search
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const departmentId = await getUserDepartmentId(req.user.id);
    const result = await getNoticesForUser(
      req.user.id,
      req.user.role,
      departmentId,
      {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        scope: req.query.scope || undefined,
        type: req.query.type || undefined,
        search: req.query.search || undefined
      }
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching notices' });
  }
});

/**
 * GET /api/notices/unread-count
 * Return { count: N } for the notification badge.
 */
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const departmentId = await getUserDepartmentId(req.user.id);
    const count = await getUnreadCount(req.user.id, req.user.role, departmentId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Server error fetching unread count' });
  }
});

/**
 * GET /api/notices/:id
 * Single notice detail.
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('author', 'name email role')
      .populate('department', 'name shortName')
      .populate({
        path: 'classInstance',
        select: 'course section series',
        populate: { path: 'course', select: 'courseCode courseName' }
      });

    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    res.json(notice);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching notice' });
  }
});

/**
 * POST /api/notices
 * Create a notice (validates scope permissions).
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    await validateCreatePermission(req);

    const { title, body, scope, department, classInstance: classInstanceId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Body is required' });
    }

    const noticeData = {
      title: title.trim(),
      body: body.trim(),
      author: req.user.id,
      scope,
      type: req.user.role === 'STUDENT' ? 'CR_GENERAL' : 'MANUAL'
    };

    if (scope === 'DEPARTMENT') {
      // If dept admin doesn't provide a department, use their own
      if (department) {
        noticeData.department = department;
      } else {
        noticeData.department = await getUserDepartmentId(req.user.id);
      }
    }

    if (scope === 'COURSE') {
      noticeData.classInstance = classInstanceId;
    }

    const notice = await createNotice(noticeData);

    const populated = await Notice.findById(notice._id)
      .populate('author', 'name email role')
      .populate('department', 'name shortName')
      .populate({
        path: 'classInstance',
        select: 'course section series',
        populate: { path: 'course', select: 'courseCode courseName' }
      });

    res.status(201).json(populated);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error creating notice' });
  }
});

/**
 * PUT /api/notices/:id/read
 * Mark a single notice as read.
 */
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).select('_id');
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    await markAsRead(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error marking notice as read' });
  }
});

/**
 * PUT /api/notices/read-all
 * Mark all visible notices as read.
 */
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const departmentId = await getUserDepartmentId(req.user.id);
    await markAllAsRead(req.user.id, req.user.role, departmentId);
    res.json({ message: 'All notices marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error marking all as read' });
  }
});

/**
 * DELETE /api/notices/:id
 * Delete a notice (author or admin only).
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const isAuthor = String(notice.author) === String(req.user.id);
    const isAdmin = req.user.role === 'CENTRAL_ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Only the author or a central admin can delete this notice' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    // Clean up read records
    await require('../models/NoticeRead').deleteMany({ notice: req.params.id });

    res.json({ message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting notice' });
  }
});

module.exports = router;
