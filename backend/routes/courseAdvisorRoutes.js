const express = require('express');
const CourseAdvisor = require('../models/CourseAdvisor');
const SectionCR = require('../models/SectionCR');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { createHttpError } = require('../utils/departmentRules');

const router = express.Router();

// Helper to get scoped department
const getScopedDepartment = async (req) => {
  const user = await User.findById(req.user.id).select('department');
  return user?.department;
};

// ─── Dept Admin Routes (Manage Course Advisors) ────────────────

/**
 * GET /api/course-advisors
 * Get all course advisors for the current department
 */
router.get('/', verifyToken, requireRole('DEPT_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'DEPT_ADMIN') {
      filter.department = await getScopedDepartment(req);
    } else if (req.query.department) {
      filter.department = req.query.department;
    }

    const advisors = await CourseAdvisor.find(filter)
      .populate('teacher', 'name email designation teacherType rollNumber')
      .populate('department', 'name shortName')
      .sort({ series: -1, section: 1 });

    res.json(advisors);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching course advisors' });
  }
});

/**
 * POST /api/course-advisors
 * Assign a new course advisor
 */
router.post('/', verifyToken, requireRole('DEPT_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  try {
    const { teacher, series, section, department } = req.body;
    let deptId = department;

    if (req.user.role === 'DEPT_ADMIN') {
      deptId = await getScopedDepartment(req);
    }

    if (!teacher || !series || !section || !deptId) {
      return res.status(400).json({ error: 'Teacher, department, series, and section are required' });
    }

    // Verify teacher belongs to the same department
    const teacherUser = await User.findById(teacher);
    if (!teacherUser || String(teacherUser.department) !== String(deptId)) {
      return res.status(400).json({ error: 'Teacher must belong to the selected department' });
    }

    const advisor = await CourseAdvisor.create({
      teacher,
      department: deptId,
      series: Number(series),
      section: section.trim()
    });

    const populated = await CourseAdvisor.findById(advisor._id)
      .populate('teacher', 'name email designation teacherType rollNumber')
      .populate('department', 'name shortName');

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This teacher is already an advisor for this section and series' });
    }
    res.status(500).json({ error: 'Server error creating course advisor' });
  }
});

/**
 * PUT /api/course-advisors/:id
 * Update a course advisor assignment
 */
router.put('/:id', verifyToken, requireRole('DEPT_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  try {
    const advisor = await CourseAdvisor.findById(req.params.id);
    if (!advisor) return res.status(404).json({ error: 'Course advisor not found' });

    if (req.user.role === 'DEPT_ADMIN') {
      const deptId = await getScopedDepartment(req);
      if (String(advisor.department) !== String(deptId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const { teacher, series, section } = req.body;

    if (teacher) {
      const teacherUser = await User.findById(teacher);
      if (!teacherUser || String(teacherUser.department) !== String(advisor.department)) {
        return res.status(400).json({ error: 'Teacher must belong to the department' });
      }
      advisor.teacher = teacher;
    }
    
    if (series) advisor.series = Number(series);
    if (section) advisor.section = section.trim();

    await advisor.save();

    const populated = await CourseAdvisor.findById(advisor._id)
      .populate('teacher', 'name email designation teacherType rollNumber')
      .populate('department', 'name shortName');

    res.json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This teacher is already an advisor for this section and series' });
    }
    res.status(500).json({ error: 'Server error updating course advisor' });
  }
});

/**
 * DELETE /api/course-advisors/:id
 * Delete a course advisor assignment
 */
router.delete('/:id', verifyToken, requireRole('DEPT_ADMIN', 'CENTRAL_ADMIN'), async (req, res) => {
  try {
    const advisor = await CourseAdvisor.findById(req.params.id);
    if (!advisor) return res.status(404).json({ error: 'Course advisor not found' });

    if (req.user.role === 'DEPT_ADMIN') {
      const deptId = await getScopedDepartment(req);
      if (String(advisor.department) !== String(deptId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    await CourseAdvisor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course advisor removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting course advisor' });
  }
});

// ─── Teacher Routes (Manage Section CRs) ──────────────────────

/**
 * GET /api/course-advisors/me/advised-sections
 * Get all sections advised by the current teacher
 */
router.get('/me/advised-sections', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const advisors = await CourseAdvisor.find({ teacher: req.user.id })
      .populate('department', 'name shortName')
      .sort({ series: -1, section: 1 });
      
    res.json(advisors);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching advised sections' });
  }
});

/**
 * GET /api/course-advisors/me/advised-sections/:id/students
 * Get all students for a specific advised section
 */
router.get('/me/advised-sections/:id/students', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const advisor = await CourseAdvisor.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!advisor) return res.status(404).json({ error: 'Advised section not found' });

    // Students are part of the section if their department, series, and section match
    // OR if they are enrolled in any ClassInstance that matches the series and section.
    // For simplicity, we assume they are properly tagged with series and section in User schema.
    const students = await User.find({
      role: 'STUDENT',
      department: advisor.department,
      series: advisor.series,
      section: advisor.section
    }).select('name email rollNumber isCR section series');

    // Get current SectionCRs to know exactly who is a CR
    const sectionCRs = await SectionCR.find({
      department: advisor.department,
      series: advisor.series,
      section: advisor.section
    }).select('student');

    const crSet = new Set(sectionCRs.map(cr => String(cr.student)));

    const enrichedStudents = students.map(s => {
      const doc = s.toObject();
      doc.isSectionCR = crSet.has(String(doc._id));
      return doc;
    });

    res.json(enrichedStudents);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching students' });
  }
});

/**
 * PUT /api/course-advisors/me/advised-sections/:id/crs
 * Set the CRs for a specific advised section
 */
router.put('/me/advised-sections/:id/crs', verifyToken, requireRole('TEACHER'), async (req, res) => {
  try {
    const advisor = await CourseAdvisor.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!advisor) return res.status(404).json({ error: 'Advised section not found' });

    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds must be an array' });
    }

    // Validate students belong to this section
    if (studentIds.length > 0) {
      const validStudents = await User.countDocuments({
        _id: { $in: studentIds },
        role: 'STUDENT',
        department: advisor.department,
        series: advisor.series,
        section: advisor.section
      });

      if (validStudents !== studentIds.length) {
        return res.status(400).json({ error: 'Some students do not belong to this section' });
      }
    }

    // Get existing CRs for this specific section
    const existingCRs = await SectionCR.find({
      department: advisor.department,
      series: advisor.series,
      section: advisor.section
    });
    
    const existingIds = existingCRs.map(cr => String(cr.student));
    
    // Determine which are new and which are removed
    const addedIds = studentIds.filter(id => !existingIds.includes(String(id)));
    const removedIds = existingIds.filter(id => !studentIds.includes(String(id)));

    // Create new SectionCR records
    if (addedIds.length > 0) {
      const newDocs = addedIds.map(id => ({
        student: id,
        department: advisor.department,
        series: advisor.series,
        section: advisor.section,
        assignedBy: req.user.id
      }));
      await SectionCR.insertMany(newDocs);
      
      // Update User.isCR to true
      await User.updateMany({ _id: { $in: addedIds } }, { isCR: true });
    }

    // Remove old SectionCR records
    if (removedIds.length > 0) {
      await SectionCR.deleteMany({
        student: { $in: removedIds },
        department: advisor.department,
        series: advisor.series,
        section: advisor.section
      });

      // We should only set isCR = false if they are not a SectionCR for ANY OTHER section.
      // (Though a student being a CR for multiple sections is highly unlikely)
      for (const removedId of removedIds) {
        const otherCR = await SectionCR.findOne({ student: removedId });
        if (!otherCR) {
          await User.findByIdAndUpdate(removedId, { isCR: false });
        }
      }
    }

    res.json({ message: 'Section CRs updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating section CRs' });
  }
});

module.exports = router;
