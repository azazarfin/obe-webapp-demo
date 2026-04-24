const express = require('express');
const Assessment = require('../models/Assessment');
const ClassInstance = require('../models/ClassInstance');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Feedback = require('../models/Feedback');
const InstructorReport = require('../models/InstructorReport');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  buildClassEvaluation,
  buildClassSummary,
  syncRegularEnrollmentsForClassInstance
} = require('../services/analyticsService');
const {
  createHttpError,
  idsEqual,
  normalizeSectionForDepartment
} = require('../utils/departmentRules');

const router = express.Router();

const { DEPARTMENT_SELECT, getScopedCurrentUser } = require('../utils/routeHelpers');
const TEACHER_SELECT = 'name email designation teacherType onLeave leaveReason';
const normalizeTeacherIds = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item?._id || item).filter(Boolean);
  }
  return value ? [value?._id || value] : [];
};

const uniqueTeacherIds = (teacherIds) => Array.from(new Set(
  normalizeTeacherIds(teacherIds).map((teacherId) => String(teacherId))
));

const getCourseWithDepartment = async (courseId) => {
  const course = await Course.findById(courseId).populate('department', DEPARTMENT_SELECT);
  if (!course) {
    throw createHttpError(404, 'Course not found');
  }
  return course;
};

const getTeachers = async (teacherIds, options = {}) => {
  const normalizedIds = uniqueTeacherIds(teacherIds);
  const allowedOnLeaveIds = new Set(uniqueTeacherIds(options.allowExistingTeacherIds || []));
  if (normalizedIds.length === 0) {
    throw createHttpError(400, 'At least one teacher must be assigned');
  }

  const teachers = await User.find({ _id: { $in: normalizedIds }, role: 'TEACHER' });
  if (teachers.length !== normalizedIds.length) {
    throw createHttpError(400, 'One or more selected teachers were not found');
  }

  const teacherMap = new Map(teachers.map((teacher) => [teacher._id.toString(), teacher]));
  normalizedIds.forEach((teacherId) => {
    const teacher = teacherMap.get(teacherId);
    if (teacher?.onLeave && !allowedOnLeaveIds.has(teacherId)) {
      throw createHttpError(400, 'Teachers marked on leave cannot be assigned to courses');
    }
  });

  return normalizedIds.map((teacherId) => teacherMap.get(teacherId));
};

const loadInstanceForAccess = async (instanceId) => {
  const instance = await ClassInstance.findById(instanceId)
    .populate({ path: 'course', populate: { path: 'department', select: DEPARTMENT_SELECT } })
    .populate('teacher', TEACHER_SELECT)
    .populate('teachers', TEACHER_SELECT);

  if (!instance) {
    throw createHttpError(404, 'Class instance not found');
  }

  return instance;
};

const syncRegularEnrollmentsSafely = async (classInstanceId) => {
  try {
    await syncRegularEnrollmentsForClassInstance(String(classInstanceId));
  } catch (error) {
    console.error(`Enrollment sync failed for class instance ${classInstanceId}:`, error);
  }
};

const ensureInstanceAccess = async (req, instance) => {
  if (req.user.role === 'DEPT_ADMIN') {
    const currentUser = await getScopedCurrentUser(req);
    if (!idsEqual(instance.course?.department?._id || instance.course?.department, currentUser.department?._id || currentUser.department)) {
      throw createHttpError(403, 'Forbidden: This class instance is outside your department');
    }
  }

  const assignedTeacherIds = uniqueTeacherIds([
    instance.teacher?._id || instance.teacher,
    ...(instance.teachers || []).map((teacher) => teacher?._id || teacher)
  ]);

  if (req.user.role === 'TEACHER' && !assignedTeacherIds.includes(String(req.user.id))) {
    throw createHttpError(403, 'Forbidden: You can only manage your own class instances');
  }
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.teacher) {
      filter.$or = [{ teacher: req.query.teacher }, { teachers: req.query.teacher }];
    }

    const series = Number.parseInt(req.query.series, 10);
    if (Number.isFinite(series)) {
      filter.series = series;
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      const departmentCourses = await Course.find({ department: currentUser.department?._id }).select('_id');
      const courseIds = departmentCourses.map((course) => course._id);

      if (req.query.course) {
        const isAllowedCourse = courseIds.some((courseId) => idsEqual(courseId, req.query.course));
        if (!isAllowedCourse) {
          return res.json([]);
        }
        filter.course = req.query.course;
      } else {
        filter.course = { $in: courseIds };
      }
    } else if (req.query.course) {
      filter.course = req.query.course;
    }

    const instances = await ClassInstance.find(filter)
      .populate({ path: 'course', populate: { path: 'department', select: DEPARTMENT_SELECT } })
      .populate('teacher', TEACHER_SELECT)
      .populate('teachers', TEACHER_SELECT)
      .sort({ createdAt: -1 });

    res.json(instances);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching class instances' });
  }
});

router.get('/:id/summary', verifyToken, async (req, res) => {
  try {
    const instance = await loadInstanceForAccess(req.params.id);
    await ensureInstanceAccess(req, instance);
    const summary = await buildClassSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching class summary' });
  }
});

router.get('/:id/evaluation', verifyToken, async (req, res) => {
  try {
    const instance = await loadInstanceForAccess(req.params.id);
    await ensureInstanceAccess(req, instance);
    const evaluation = await buildClassEvaluation(req.params.id);
    res.json(evaluation);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching evaluation report' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const currentUser = req.user.role === 'DEPT_ADMIN' ? await getScopedCurrentUser(req) : null;
    const course = await getCourseWithDepartment(req.body.course);

    if (req.user.role === 'DEPT_ADMIN' && !idsEqual(course.department?._id || course.department, currentUser.department?._id || currentUser.department)) {
      return res.status(403).json({ error: 'Forbidden: You can only create running courses for your own department' });
    }

    const teachers = await getTeachers(req.body.teachers || req.body.teacher);
    const series = Number.parseInt(req.body.series, 10);
    if (!Number.isFinite(series)) {
      return res.status(400).json({ error: 'Series is required' });
    }

    const payload = {
      course: course._id,
      teacher: teachers[0]._id,
      teachers: teachers.map((teacher) => teacher._id),
      series,
      section: normalizeSectionForDepartment(course.department, req.body.section),
      status: req.body.status || 'Running',
      coPoMapping: Array.isArray(req.body.coPoMapping) ? req.body.coPoMapping : []
    };

    const instance = await ClassInstance.create(payload);
    await syncRegularEnrollmentsSafely(instance._id);
    const populated = await loadInstanceForAccess(instance._id);

    res.status(201).json(populated);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error creating class instance' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const existingInstance = await loadInstanceForAccess(req.params.id);
    await ensureInstanceAccess(req, existingInstance);

    if (req.user.role === 'TEACHER') {
      const forbiddenTeacherFields = ['course', 'series', 'section', 'teacher', 'teachers', 'status'];
      const touchedForbiddenField = forbiddenTeacherFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
      if (touchedForbiddenField) {
        return res.status(403).json({ error: 'Forbidden: Teachers cannot change course assignment details' });
      }
    }

    const updateData = { ...req.body };
    const course = await getCourseWithDepartment(req.body.course || existingInstance.course?._id || existingInstance.course);

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      if (!idsEqual(course.department?._id || course.department, currentUser.department?._id || currentUser.department)) {
        return res.status(403).json({ error: 'Forbidden: You can only update running courses for your own department' });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'teacher') || Array.isArray(req.body.teachers)) {
      const teachers = await getTeachers(req.body.teachers || req.body.teacher, {
        allowExistingTeacherIds: [
          existingInstance.teacher?._id || existingInstance.teacher,
          ...(existingInstance.teachers || []).map((teacher) => teacher?._id || teacher)
        ]
      });
      updateData.teacher = teachers[0]._id;
      updateData.teachers = teachers.map((teacher) => teacher._id);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'series')) {
      const series = Number.parseInt(req.body.series, 10);
      if (!Number.isFinite(series)) {
        return res.status(400).json({ error: 'Series must be a valid year' });
      }
      updateData.series = series;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'section') || Object.prototype.hasOwnProperty.call(req.body, 'course')) {
      updateData.section = normalizeSectionForDepartment(course.department, req.body.section ?? existingInstance.section);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'course')) {
      updateData.course = course._id;
    }

    await ClassInstance.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    if (req.body.course || req.body.series || req.body.section) {
      await syncRegularEnrollmentsSafely(req.params.id);
    }

    const instance = await loadInstanceForAccess(req.params.id);
    res.json(instance);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error updating class instance' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const instance = await loadInstanceForAccess(req.params.id);
    await ensureInstanceAccess(req, instance);

    await Promise.all([
      Assessment.deleteMany({ classInstance: req.params.id }),
      Enrollment.deleteMany({ classInstance: req.params.id }),
      Feedback.deleteMany({ classInstance: req.params.id }),
      InstructorReport.deleteMany({ classInstance: req.params.id })
    ]);

    await ClassInstance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class instance deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error deleting class instance' });
  }
});



module.exports = router;
