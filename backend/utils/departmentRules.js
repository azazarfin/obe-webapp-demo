const SECTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const idsEqual = (left, right) => String(left) === String(right);

const normalizeCourseCode = (courseCode = '') => String(courseCode).trim().toUpperCase();

const compactCourseCode = (courseCode = '') => normalizeCourseCode(courseCode).replace(/\s+/g, '');

const getAvailableSections = (department) => {
  if (!department?.hasSections) {
    return [];
  }

  const count = Number(department.sectionCount) || 0;
  return SECTION_LETTERS.slice(0, Math.min(count, SECTION_LETTERS.length));
};

const normalizeSectionForDepartment = (department, section) => {
  const availableSections = getAvailableSections(department);

  if (availableSections.length === 0) {
    return 'N/A';
  }

  const normalizedSection = String(section || '').trim().toUpperCase();
  if (!availableSections.includes(normalizedSection)) {
    throw createHttpError(
      400,
      `Section must be one of: ${availableSections.join(', ')}`
    );
  }

  return normalizedSection;
};

const courseCodeMatchesDepartment = (courseCode, department) => (
  compactCourseCode(courseCode).startsWith(String(department?.shortName || '').trim().toUpperCase())
);

module.exports = {
  SECTION_LETTERS,
  compactCourseCode,
  courseCodeMatchesDepartment,
  createHttpError,
  getAvailableSections,
  idsEqual,
  normalizeCourseCode,
  normalizeSectionForDepartment
};
