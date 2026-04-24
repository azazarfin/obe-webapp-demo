/**
 * Shared route-level helpers for department-scoped access control.
 *
 * Previously these were copy-pasted across classInstanceRoutes, courseRoutes,
 * userRoutes, and feedbackRoutes. Centralising them here eliminates drift.
 */

const User = require('../models/User');
const Department = require('../models/Department');
const { createHttpError } = require('./departmentRules');

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

module.exports = {
  DEPARTMENT_SELECT,
  resolveDepartmentId,
  getScopedCurrentUser,
  ensureDepartment
};
