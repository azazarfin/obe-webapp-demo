const getAssignedTeacherIds = (classInstance) => {
  const teacherIds = [
    classInstance.teacher?._id || classInstance.teacher,
    ...((classInstance.teachers || []).map((teacher) => teacher?._id || teacher))
  ].filter(Boolean);

  return Array.from(new Set(teacherIds.map((teacherId) => String(teacherId))));
};

module.exports = { getAssignedTeacherIds };
