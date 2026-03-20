const express = require('express');
const Course = require('../models/Course');
const Department = require('../models/Department');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  courseCodeMatchesDepartment,
  createHttpError,
  idsEqual,
  normalizeCourseCode
} = require('../utils/departmentRules');

const router = express.Router();

const DEPARTMENT_SELECT = 'name shortName hasSections sectionCount';

const resolveDepartmentId = (value) => value?._id || value || null;

const getScopedCurrentUser = async (req) => {
  const currentUser = await User.findById(req.user.id).populate('department', DEPARTMENT_SELECT);
  if (!currentUser) {
    throw createHttpError(401, 'User not found');
  }
  return currentUser;
};

const ensureDepartment = async (departmentId) => {
  if (!departmentId) {
    throw createHttpError(400, 'Department is required');
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    throw createHttpError(400, 'Department not found');
  }

  return department;
};

const buildCoursePayload = async (req, existingCourse = null) => {
  const currentUser = req.user.role === 'DEPT_ADMIN' ? await getScopedCurrentUser(req) : null;
  const requestedDepartmentId = req.user.role === 'DEPT_ADMIN'
    ? currentUser.department?._id
    : resolveDepartmentId(req.body.department || existingCourse?.department);

  const department = await ensureDepartment(requestedDepartmentId);
  const courseCode = normalizeCourseCode(req.body.courseCode || existingCourse?.courseCode);

  if (!courseCodeMatchesDepartment(courseCode, department)) {
    throw createHttpError(
      400,
      `Course code must start with the department short name (${department.shortName})`
    );
  }

  return {
    courseCode,
    courseName: typeof req.body.courseName === 'string' ? req.body.courseName.trim() : existingCourse?.courseName,
    credit: req.body.credit !== undefined ? Number(req.body.credit) : existingCourse?.credit,
    type: req.body.type || existingCourse?.type,
    semester: req.body.semester || existingCourse?.semester,
    department: department._id,
    syllabus: typeof req.body.syllabus === 'string' ? req.body.syllabus.trim() : (existingCourse?.syllabus || '')
  };
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.semester) filter.semester = req.query.semester;

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      if (!currentUser.department) {
        return res.status(400).json({ error: 'Department admin is not assigned to any department' });
      }
      filter.department = currentUser.department._id;
    } else if (req.query.department) {
      filter.department = req.query.department;
    }

    const courses = await Course.find(filter)
      .populate('department', DEPARTMENT_SELECT)
      .sort({ courseCode: 1 });
    res.json(courses);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching courses' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('department', DEPARTMENT_SELECT);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      if (!idsEqual(course.department?._id || course.department, currentUser.department?._id || currentUser.department)) {
        return res.status(403).json({ error: 'Forbidden: This course is outside your department' });
      }
    }

    res.json(course);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const course = await Course.create(await buildCoursePayload(req));
    const populated = await course.populate('department', DEPARTMENT_SELECT);
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(error.status || 500).json({ error: error.message || 'Server error creating course' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const existingCourse = await Course.findById(req.params.id).populate('department', DEPARTMENT_SELECT);
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      if (!idsEqual(existingCourse.department?._id || existingCourse.department, currentUser.department?._id || currentUser.department)) {
        return res.status(403).json({ error: 'Forbidden: You can only update courses from your own department' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      await buildCoursePayload(req, existingCourse),
      { new: true, runValidators: true }
    ).populate('department', DEPARTMENT_SELECT);

    res.json(course);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(error.status || 500).json({ error: error.message || 'Server error updating course' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('department', DEPARTMENT_SELECT);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      if (!idsEqual(course.department?._id || course.department, currentUser.department?._id || currentUser.department)) {
        return res.status(403).json({ error: 'Forbidden: You can only delete courses from your own department' });
      }
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error deleting course' });
  }
});

module.exports = router;
