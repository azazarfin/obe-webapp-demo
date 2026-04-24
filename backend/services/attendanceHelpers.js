/**
 * Attendance-related helpers extracted from analyticsService.
 *
 * Handles attendance summary building, multi-teacher attendance aggregation,
 * date key normalisation, and status normalisation.
 */

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const normalizeAttendanceStatus = (value) => {
  const normalized = String(value || 'Present').trim().toLowerCase();
  if (normalized === 'a' || normalized === 'absent') return 'Absent';
  if (normalized === 'l' || normalized === 'late') return 'Late';
  return 'Present';
};

const getAttendanceMarks = (percentage) => {
  if (percentage >= 90) return 10;
  if (percentage >= 85) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 75) return 7;
  if (percentage >= 70) return 6;
  if (percentage >= 65) return 5;
  if (percentage >= 60) return 4;
  return 0;
};

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

const buildAttendanceSummary = (attendanceRecord = [], teacherFilter = null) => {
  const byDate = new Map();

  attendanceRecord.forEach((record) => {
    if (!record?.date) return;
    if (teacherFilter && record.takenBy) {
      const recordTeacherId = record.takenBy._id ? record.takenBy._id.toString() : record.takenBy.toString();
      if (recordTeacherId !== teacherFilter) return;
    } else if (teacherFilter && !record.takenBy) {
      return;
    }
    const dateKey = toDateKey(record.date);
    const takenById = record.takenBy?._id ? record.takenBy._id.toString() : (record.takenBy ? record.takenBy.toString() : null);
    const takenByName = record.takenBy?.name || null;
    byDate.set(dateKey, {
      status: normalizeAttendanceStatus(record.status),
      takenBy: takenById,
      takenByName
    });
  });

  const attendanceLog = Array.from(byDate.entries())
    .sort(([left], [right]) => new Date(left) - new Date(right))
    .map(([date, data]) => ({
      date,
      status: data.status,
      takenBy: data.takenBy,
      takenByName: data.takenByName
    }));

  const totalClasses = attendanceLog.length;
  const presentCount = attendanceLog.filter((entry) => entry.status !== 'Absent').length;
  const absentCount = totalClasses - presentCount;
  const percentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

  return {
    attendanceLog,
    totalClasses,
    presentCount,
    absentCount,
    percentage: round(percentage, 1),
    marks: getAttendanceMarks(percentage)
  };
};

const buildMultiTeacherAttendance = (attendanceRecord = [], teacherIds = []) => {
  if (teacherIds.length <= 1) {
    return null;
  }

  const perTeacher = {};
  let totalMarks = 0;
  let barred = false;

  teacherIds.forEach((teacherId) => {
    const summary = buildAttendanceSummary(attendanceRecord, teacherId);
    perTeacher[teacherId] = summary;
    totalMarks += summary.marks;
    if (summary.totalClasses > 0 && summary.percentage < 50) {
      barred = true;
    }
  });

  const averagedMarks = round(totalMarks / teacherIds.length, 1);

  const combinedSummary = buildAttendanceSummary(attendanceRecord);

  return {
    perTeacher,
    averagedMarks,
    barred,
    combined: combinedSummary
  };
};

module.exports = {
  toDateKey,
  normalizeAttendanceStatus,
  getAttendanceMarks,
  buildAttendanceSummary,
  buildMultiTeacherAttendance
};
