const SECTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const getDepartmentById = (departments, departmentId) => (
  departments.find((department) => department._id === departmentId) || null
);

export const getDepartmentSections = (department) => {
  if (!department?.hasSections) {
    return [];
  }

  const count = Number(department.sectionCount) || 0;
  return SECTION_LETTERS.slice(0, Math.min(count, SECTION_LETTERS.length));
};

export const departmentUsesSections = (department) => getDepartmentSections(department).length > 0;

export const normalizeSectionValue = (department, section) => {
  const availableSections = getDepartmentSections(department);
  if (availableSections.length === 0) {
    return 'N/A';
  }

  return availableSections.includes(section) ? section : availableSections[0];
};

export const formatSectionLabel = (section) => (section && section !== 'N/A' ? section : 'No Section');
