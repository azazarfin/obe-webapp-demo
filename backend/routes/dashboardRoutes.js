const express = require('express');
const ClassInstance = require('../models/ClassInstance');
const Course = require('../models/Course');
const Department = require('../models/Department');
const InstructorReport = require('../models/InstructorReport');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getStudentDashboardData } = require('../services/analyticsService');

const router = express.Router();

router.get('/central', verifyToken, requireRole('CENTRAL_ADMIN'), async (req, res) => {
  try {
    const [departments, courses, teachers, students] = await Promise.all([
      Department.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ role: 'TEACHER' }),
      User.countDocuments({ role: 'STUDENT' })
    ]);

    res.json({
      totalDepartments: departments,
      totalCourses: courses,
      totalTeachers: teachers,
      totalStudents: students
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching central dashboard data' });
  }
});

router.get('/department', verifyToken, requireRole('DEPT_ADMIN'), async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('department');
    const departmentId = currentUser?.department?.toString();

    if (!departmentId) {
      return res.status(400).json({ error: 'Department admin is not assigned to any department' });
    }

    const [department, courseCount, teacherCount, studentCount, classInstances] = await Promise.all([
      Department.findById(departmentId),
      Course.countDocuments({ department: departmentId }),
      User.countDocuments({ role: 'TEACHER', department: departmentId }),
      User.countDocuments({ role: 'STUDENT', department: departmentId }),
      ClassInstance.find().populate({
        path: 'course',
        select: 'department'
      })
    ]);

    const departmentInstances = classInstances.filter((instance) => {
      const courseDepartmentId = instance.course?.department?._id?.toString() || instance.course?.department?.toString();
      return courseDepartmentId === departmentId;
    });

    const runningClassInstances = departmentInstances.filter((instance) => instance.status === 'Running').length;
    const reportCount = await InstructorReport.countDocuments({
      classInstance: { $in: departmentInstances.map((instance) => instance._id) }
    });

    res.json({
      department,
      totalCourses: courseCount,
      totalTeachers: teacherCount,
      totalStudents: studentCount,
      runningClassInstances,
      reportCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching department dashboard data' });
  }
});

router.get('/student', verifyToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const data = await getStudentDashboardData(req.user.id);
    res.json(data);
  } catch (error) {
    const status = error.message === 'Student not found' ? 404 : 500;
    res.status(status).json({ error: error.message || 'Server error fetching student dashboard data' });
  }
});

module.exports = router;
