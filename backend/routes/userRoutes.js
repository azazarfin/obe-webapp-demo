const express = require('express');
const Department = require('../models/Department');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
  createHttpError,
  idsEqual,
  normalizeSectionForDepartment
} = require('../utils/departmentRules');

const router = express.Router();

const DEPARTMENT_SELECT = 'name shortName hasSections sectionCount';

const parseSeries = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

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

const buildUserPayload = async (req, existingUser = null) => {
  const requestedRole = req.body.role || existingUser?.role;

  if (!requestedRole) {
    throw createHttpError(400, 'Role is required');
  }

  if (req.user.role === 'DEPT_ADMIN' && !['STUDENT', 'TEACHER'].includes(requestedRole)) {
    throw createHttpError(403, 'Department admins can only manage students and teachers of their own department');
  }

  const currentUser = req.user.role === 'DEPT_ADMIN' ? await getScopedCurrentUser(req) : null;
  let department = null;

  if (requestedRole === 'STUDENT' || requestedRole === 'DEPT_ADMIN') {
    const requestedDepartmentId = req.user.role === 'DEPT_ADMIN'
      ? currentUser.department?._id
      : resolveDepartmentId(req.body.department || existingUser?.department);

    department = await ensureDepartment(requestedDepartmentId);
  } else if (requestedRole === 'TEACHER') {
    const requestedDepartmentId = resolveDepartmentId(
      req.body.department || existingUser?.department || currentUser?.department?._id
    );
    department = await ensureDepartment(requestedDepartmentId);
  }

  const payload = {
    name: typeof req.body.name === 'string' ? req.body.name.trim() : existingUser?.name,
    email: typeof req.body.email === 'string' ? req.body.email.trim() : existingUser?.email,
    role: requestedRole,
    department: department?._id
  };

  if (requestedRole === 'STUDENT') {
    payload.rollNumber = typeof req.body.rollNumber === 'string' ? req.body.rollNumber.trim() : existingUser?.rollNumber;
    payload.series = parseSeries(req.body.series ?? existingUser?.series);
    payload.section = normalizeSectionForDepartment(department, req.body.section ?? existingUser?.section);
    payload.designation = undefined;
    payload.teacherType = undefined;
    payload.onLeave = undefined;
    payload.leaveReason = undefined;
  } else if (requestedRole === 'TEACHER') {
    payload.designation = typeof req.body.designation === 'string' ? req.body.designation.trim() : existingUser?.designation;
    payload.teacherType = req.body.teacherType === 'Guest' ? 'Guest' : 'Host';
    payload.onLeave = Boolean(req.body.onLeave);
    payload.leaveReason = payload.onLeave && typeof req.body.leaveReason === 'string'
      ? req.body.leaveReason.trim()
      : '';
    payload.rollNumber = undefined;
    payload.series = undefined;
    payload.section = undefined;
  } else {
    payload.rollNumber = undefined;
    payload.series = undefined;
    payload.section = undefined;
    payload.designation = undefined;
    payload.teacherType = undefined;
    payload.onLeave = undefined;
    payload.leaveReason = undefined;
  }

  return payload;
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = {};

    if (req.query.role) filter.role = req.query.role;
    if (req.query.rollNumber) filter.rollNumber = req.query.rollNumber;
    if (req.query.teacherType) filter.teacherType = req.query.teacherType;
    if (req.query.onLeave === 'true' || req.query.onLeave === 'false') {
      filter.onLeave = req.query.onLeave === 'true';
    }

    const requestedDepartmentId = resolveDepartmentId(req.query.department);
    if (requestedDepartmentId) {
      filter.department = requestedDepartmentId;
    }

    const series = parseSeries(req.query.series);
    if (series) {
      filter.series = series;
    }

    if (req.query.section) {
      filter.section = req.query.section;
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      if (!currentUser.department) {
        return res.status(400).json({ error: 'Department admin is not assigned to any department' });
      }

      if (req.query.role !== 'TEACHER') {
        filter.department = currentUser.department._id;
      }
    }

    if (req.query.activeOnly === 'true' && filter.role === 'TEACHER') {
      filter.onLeave = false;
    }

    const users = await User.find(filter)
      .populate('department', DEPARTMENT_SELECT)
      .select('-password -__v')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error fetching users' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', DEPARTMENT_SELECT)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      const isTeacher = user.role === 'TEACHER';
      if (!isTeacher && !idsEqual(user.department?._id || user.department, currentUser.department?._id || currentUser.department)) {
        return res.status(403).json({ error: 'Forbidden: This user is outside your department' });
      }
    }

    res.json(user);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error' });
  }
});

router.post('/', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const payload = await buildUserPayload(req);
    const user = await User.create({
      ...payload,
      password: req.body.password || '123456'
    });

    const populated = await user.populate('department', DEPARTMENT_SELECT);
    const { password: _password, ...userData } = populated.toObject();
    res.status(201).json(userData);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(error.status || 500).json({ error: error.message || 'Server error creating user' });
  }
});

router.post('/bulk', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students array is required' });
    }

    const currentUser = req.user.role === 'DEPT_ADMIN' ? await getScopedCurrentUser(req) : null;
    const defaultDepartment = req.user.role === 'DEPT_ADMIN'
      ? currentUser.department
      : await ensureDepartment(resolveDepartmentId(students[0]?.department));

    const created = [];
    const errors = [];

    for (const student of students) {
      try {
        const department = req.user.role === 'DEPT_ADMIN'
          ? defaultDepartment
          : await ensureDepartment(resolveDepartmentId(student.department) || defaultDepartment._id);

        const user = await User.create({
          name: student.name || `Student ${student.rollNumber}`,
          email: student.email,
          role: 'STUDENT',
          department: department._id,
          rollNumber: student.rollNumber,
          series: parseSeries(student.series),
          section: normalizeSectionForDepartment(department, student.section),
          password: '123456'
        });

        created.push({ rollNumber: user.rollNumber, email: user.email });
      } catch (err) {
        errors.push({ rollNumber: student.rollNumber, error: err.message });
      }
    }

    res.status(201).json({
      created: created.length,
      errors: errors.length,
      details: { created, errors }
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error during bulk creation' });
  }
});

router.put('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      const isSameDepartment = idsEqual(existingUser.department, currentUser.department?._id || currentUser.department);
      const isTeacher = existingUser.role === 'TEACHER';
      const isStudentInDepartment = existingUser.role === 'STUDENT' && isSameDepartment;

      if (!isTeacher && !isStudentInDepartment) {
        return res.status(403).json({ error: 'Forbidden: You can only update teachers or students from your own department' });
      }
    }

    const updateData = await buildUserPayload(req, existingUser);
    delete updateData.password;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('department', DEPARTMENT_SELECT)
      .select('-password -__v');

    res.json(user);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error updating user' });
  }
});

router.delete('/:id', verifyToken, requireRole('CENTRAL_ADMIN', 'DEPT_ADMIN'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role === 'DEPT_ADMIN') {
      const currentUser = await getScopedCurrentUser(req);
      const isSameDepartment = idsEqual(user.department, currentUser.department?._id || currentUser.department);
      const isTeacher = user.role === 'TEACHER';
      const isStudentInDepartment = user.role === 'STUDENT' && isSameDepartment;

      if (!isTeacher && !isStudentInDepartment) {
        return res.status(403).json({ error: 'Forbidden: You can only delete teachers or students from your own department' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error deleting user' });
  }
});

module.exports = router;
