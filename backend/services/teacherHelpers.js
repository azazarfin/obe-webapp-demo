/**
 * Teacher information helpers extracted from analyticsService.
 *
 * Handles teacher list extraction, name/email formatting,
 * and Mongoose population helpers for class instances and enrollments.
 */

const ClassInstance = require('../models/ClassInstance');
const Enrollment = require('../models/Enrollment');

const populateTeacherFields = (query) => query
  .populate('teacher', 'name email designation teacherType onLeave leaveReason')
  .populate('teachers', 'name email designation teacherType onLeave leaveReason');

const populateClassInstance = (query) => populateTeacherFields(
  query.populate({ path: 'course', populate: { path: 'department', select: 'name shortName' } })
);

const populateEnrollment = (query) => query
  .populate('student', 'name email rollNumber series section department')
  .populate({
    path: 'classInstance',
    populate: [
      { path: 'course', populate: { path: 'department', select: 'name shortName' } },
      { path: 'teacher', select: 'name email designation teacherType onLeave leaveReason' },
      { path: 'teachers', select: 'name email designation teacherType onLeave leaveReason' }
    ]
  })
  .populate('marks.assessment')
  .populate('attendanceRecord.takenBy', 'name email');

const getAssignedTeachers = (classInstance) => {
  const teachers = Array.isArray(classInstance?.teachers)
    ? classInstance.teachers.filter(Boolean)
    : [];

  if (teachers.length > 0) {
    return teachers;
  }

  return classInstance?.teacher ? [classInstance.teacher] : [];
};

const getAssignedTeacherNames = (classInstance) => {
  const names = getAssignedTeachers(classInstance)
    .map((teacher) => teacher?.name)
    .filter(Boolean);

  return names.length > 0 ? names.join(', ') : 'Unassigned';
};

const getAssignedTeacherEmails = (classInstance) => (
  getAssignedTeachers(classInstance)
    .map((teacher) => teacher?.email)
    .filter(Boolean)
    .join(', ')
);

const ensureClassInstance = async (classInstanceOrId) => {
  if (!classInstanceOrId) {
    throw new Error('Class instance is required');
  }

  if (typeof classInstanceOrId === 'string' || !classInstanceOrId.course?.courseCode) {
    const instanceId = typeof classInstanceOrId === 'string'
      ? classInstanceOrId
      : classInstanceOrId._id;
    const instance = await populateClassInstance(ClassInstance.findById(instanceId));
    if (!instance) {
      throw new Error('Class instance not found');
    }
    return instance;
  }

  return classInstanceOrId;
};

module.exports = {
  populateTeacherFields,
  populateClassInstance,
  populateEnrollment,
  getAssignedTeachers,
  getAssignedTeacherNames,
  getAssignedTeacherEmails,
  ensureClassInstance
};
