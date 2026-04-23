const Notice = require('../models/Notice');
const NoticeRead = require('../models/NoticeRead');
const Enrollment = require('../models/Enrollment');
const ClassInstance = require('../models/ClassInstance');
const User = require('../models/User');

/**
 * Create a notice and persist it.
 * Auto-notifications (ASSESSMENT, FEEDBACK_OPEN, FEEDBACK_CLOSE) are fire-and-forget;
 * failures are logged but never block the caller.
 */
const createNotice = async (data) => {
  const notice = await Notice.create({
    title: data.title,
    body: data.body,
    author: data.author,
    scope: data.scope,
    department: data.department || undefined,
    classInstance: data.classInstance || undefined,
    type: data.type || 'MANUAL',
    relatedEntity: data.relatedEntity || undefined
  });
  return notice;
};

/**
 * Build the MongoDB query filter that resolves which notices a user can see.
 *
 * Visibility rules:
 *   ALL          → everyone
 *   DEPARTMENT   → users whose department matches
 *   COURSE       → teachers assigned to the ClassInstance + enrolled students
 */
const buildNoticeFilter = async (userId, role, departmentId) => {
  // Start with scope:ALL — visible to everyone
  const orConditions = [{ scope: 'ALL' }];

  // DEPARTMENT-scoped notices for the user's own department
  if (departmentId) {
    orConditions.push({ scope: 'DEPARTMENT', department: departmentId });
  }

  // COURSE-scoped: find class instances the user is part of
  let classInstanceIds = [];

  if (role === 'TEACHER') {
    const instances = await ClassInstance.find({
      $or: [{ teacher: userId }, { teachers: userId }]
    }).select('_id');
    classInstanceIds = instances.map((ci) => ci._id);
  } else if (role === 'STUDENT') {
    const enrollments = await Enrollment.find({
      student: userId,
      status: { $ne: 'hidden' }
    }).select('classInstance');
    classInstanceIds = enrollments.map((e) => e.classInstance);
  } else if (role === 'DEPT_ADMIN' && departmentId) {
    // Dept admins see course-scoped notices for courses in their department
    const Course = require('../models/Course');
    const deptCourseIds = (await Course.find({ department: departmentId }).select('_id'))
      .map((c) => c._id);
    const instances = await ClassInstance.find({ course: { $in: deptCourseIds } }).select('_id');
    classInstanceIds = instances.map((ci) => ci._id);
  } else if (role === 'CENTRAL_ADMIN') {
    // Central admin sees all course-scoped notices
    const instances = await ClassInstance.find({}).select('_id');
    classInstanceIds = instances.map((ci) => ci._id);
  }

  if (classInstanceIds.length > 0) {
    orConditions.push({ scope: 'COURSE', classInstance: { $in: classInstanceIds } });
  }

  return { $or: orConditions };
};

/**
 * Fetch paginated notices for a user, with read status.
 */
const getNoticesForUser = async (userId, role, departmentId, options = {}) => {
  const { page = 1, limit = 20, scope, type, search } = options;

  const baseFilter = await buildNoticeFilter(userId, role, departmentId);

  // Apply optional filters on top
  const filters = { ...baseFilter };
  if (scope) {
    filters.scope = scope;
  }
  if (type) {
    filters.type = type;
  }
  if (search) {
    filters.$and = [
      ...(filters.$and || []),
      {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { body: { $regex: search, $options: 'i' } }
        ]
      }
    ];
  }

  const skip = (page - 1) * limit;

  const [notices, total] = await Promise.all([
    Notice.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email role')
      .populate('department', 'name shortName')
      .populate({
        path: 'classInstance',
        select: 'course section series',
        populate: { path: 'course', select: 'courseCode courseName' }
      })
      .lean(),
    Notice.countDocuments(filters)
  ]);

  // Attach read status
  const noticeIds = notices.map((n) => n._id);
  const reads = await NoticeRead.find({
    notice: { $in: noticeIds },
    user: userId
  }).select('notice');
  const readSet = new Set(reads.map((r) => r.notice.toString()));

  const enriched = notices.map((notice) => ({
    ...notice,
    isRead: readSet.has(notice._id.toString())
  }));

  return {
    notices: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get the count of unread notices for a user (for the bell badge).
 */
const getUnreadCount = async (userId, role, departmentId) => {
  const filter = await buildNoticeFilter(userId, role, departmentId);
  const totalNotices = await Notice.find(filter).select('_id').lean();
  const totalIds = totalNotices.map((n) => n._id);

  if (totalIds.length === 0) return 0;

  const readCount = await NoticeRead.countDocuments({
    notice: { $in: totalIds },
    user: userId
  });

  return totalIds.length - readCount;
};

/**
 * Mark a single notice as read for a user.
 */
const markAsRead = async (noticeId, userId) => {
  await NoticeRead.findOneAndUpdate(
    { notice: noticeId, user: userId },
    { notice: noticeId, user: userId, readAt: new Date() },
    { upsert: true, new: true }
  );
};

/**
 * Mark all visible notices as read for a user.
 */
const markAllAsRead = async (userId, role, departmentId) => {
  const filter = await buildNoticeFilter(userId, role, departmentId);
  const notices = await Notice.find(filter).select('_id').lean();
  const noticeIds = notices.map((n) => n._id);

  if (noticeIds.length === 0) return;

  const ops = noticeIds.map((noticeId) => ({
    updateOne: {
      filter: { notice: noticeId, user: userId },
      update: { notice: noticeId, user: userId, readAt: new Date() },
      upsert: true
    }
  }));

  await NoticeRead.bulkWrite(ops, { ordered: false });
};

/**
 * Fire-and-forget auto-notification helper.
 * Logs errors but never throws — used for assessment/feedback hooks.
 */
const createAutoNotice = async (data) => {
  try {
    await createNotice(data);
  } catch (err) {
    console.error(`[NotificationService] Failed to create auto-notice: ${err.message}`);
  }
};

module.exports = {
  createNotice,
  getNoticesForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createAutoNotice
};
