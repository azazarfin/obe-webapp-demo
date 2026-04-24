/**
 * Core analytics service — OBE attainment, class evaluation, and student dashboard.
 *
 * Attendance, grading, and teacher helpers have been extracted into:
 *   - attendanceHelpers.js
 *   - gradingHelpers.js
 *   - teacherHelpers.js
 */

const Assessment = require('../models/Assessment');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { calculateBestOfNAverage } = require('./obeEngine');

// ─── Imported helpers ──────────────────────────────────────────
const { toDateKey, buildAttendanceSummary, buildMultiTeacherAttendance } = require('./attendanceHelpers');
const { OBE_THRESHOLD, THEORY_COMPONENT_WEIGHTS, round, getGPA, normalizeComponentToWeight } = require('./gradingHelpers');
const {
  populateEnrollment,
  getAssignedTeachers,
  getAssignedTeacherNames,
  getAssignedTeacherEmails,
  ensureClassInstance
} = require('./teacherHelpers');

// ─── Constants ─────────────────────────────────────────────────

const DEFAULT_FEEDBACK_QUESTIONS = [
  'Level of effort you put into the course',
  'The course contents met the CLOs.',
  'The course contents were well structured and arranged properly.',
  'The course contents were updated and effective in developing professional skills.',
  'The assessment rubrics were fair and clear enough.',
  'The assessment tools were appropriate to evaluate the CLOs.'
];

const sanitizeFeedbackQuestions = () => {
  return DEFAULT_FEEDBACK_QUESTIONS;
};

// ─── Enrollment sync ───────────────────────────────────────────

const syncRegularEnrollmentsForClassInstance = async (classInstanceOrId) => {
  const instance = await ensureClassInstance(classInstanceOrId);
  const course = instance.course;

  if (!course?.department) {
    return 0;
  }

  const studentFilter = {
    role: 'STUDENT',
    department: course.department._id || course.department,
    series: instance.series
  };

  if (instance.section && instance.section !== 'N/A') {
    studentFilter.section = instance.section;
  } else {
    studentFilter.$or = [
      { section: 'N/A' },
      { section: null },
      { section: '' },
      { section: { $exists: false } }
    ];
  }

  const [students, existingEnrollments] = await Promise.all([
    User.find(studentFilter).select('_id'),
    Enrollment.find({ classInstance: instance._id }).select('student')
  ]);

  const existingStudentIds = new Set(
    existingEnrollments.map((enrollment) => enrollment.student.toString())
  );

  const documentsToInsert = students
    .filter((student) => !existingStudentIds.has(student._id.toString()))
    .map((student) => ({
      student: student._id,
      classInstance: instance._id,
      type: 'regular',
      status: 'active'
    }));

  if (documentsToInsert.length > 0) {
    await Enrollment.insertMany(documentsToInsert);
  }

  return documentsToInsert.length;
};

// ─── Assessment helpers ────────────────────────────────────────

const getAssessmentTypeLabel = (assessment) => assessment.typeLabel || assessment.type;

const getAssessmentBuckets = (assessment, courseType) => {
  const type = assessment.type;

  if (type === 'CT') return ['ct'];
  if (type === 'Final') return ['final'];
  if (courseType === 'Sessional') {
    if (type === 'Quiz') return ['quiz'];
    if (type === 'Viva') return ['viva'];
    if (type === 'LabFinal') return ['labFinal'];
    return ['performance'];
  }

  if (type === 'Assignment' || type === 'Presentation' || type === 'Quiz' || type === 'Custom') {
    return ['assignment'];
  }

  return ['assignment'];
};

const isAssignmentBucketType = (type) => ['Assignment', 'Presentation', 'Quiz', 'Custom'].includes(type);

const buildAssessmentScoreEntry = (assessment, earned) => ({
  id: assessment._id.toString(),
  type: assessment.type,
  typeLabel: getAssessmentTypeLabel(assessment),
  title: assessment.title,
  totalMarks: Number(assessment.totalMarks) || 0,
  rawScore: earned,
  mappedCO: assessment.mappedCO || '',
  mappedPOs: assessment.mappedPOs || [],
  finalPart: assessment.finalPart || '',
  questionNo: assessment.questionNo || '',
  assessmentDate: assessment.assessmentDate || null,
  createdBy: assessment.createdBy?.name || null
});

// ─── Component calculation (CQ-3 extraction) ──────────────────

const calculateAttendanceComponent = (enrollment, classInstance) => {
  const assignedTeachers = getAssignedTeachers(classInstance);
  const teacherIds = assignedTeachers.map((t) => (t._id ? t._id.toString() : t.toString()));
  const isMultiTeacher = teacherIds.length > 1;

  const attendance = buildAttendanceSummary(enrollment.attendanceRecord || []);
  const multiTeacherAttendance = isMultiTeacher
    ? buildMultiTeacherAttendance(enrollment.attendanceRecord || [], teacherIds)
    : null;

  const effectiveAttendanceMarks = multiTeacherAttendance
    ? multiTeacherAttendance.averagedMarks
    : attendance.marks;
  const isBarred = multiTeacherAttendance
    ? multiTeacherAttendance.barred
    : (attendance.totalClasses > 0 && attendance.percentage < 50);

  return { attendance, multiTeacherAttendance, effectiveAttendanceMarks, isBarred, isMultiTeacher, teacherIds };
};

const calculateAssessmentComponents = (assessments, enrollment, classInstance, effectiveAttendanceMarks, isMultiTeacher) => {
  const courseType = classInstance.course?.type || 'Theory';

  const markMap = new Map();
  (enrollment.marks || []).forEach((entry) => {
    if (!entry.assessment) return;
    const assessmentId = entry.assessment._id ? entry.assessment._id.toString() : entry.assessment.toString();
    markMap.set(assessmentId, Number(entry.rawScore) || 0);
  });

  const components = {
    attendance: { earned: effectiveAttendanceMarks, total: 10 },
    ct: { earned: 0, total: 0 },
    assignment: { earned: 0, total: 0 },
    final: { earned: 0, total: 0 },
    quiz: { earned: 0, total: 0 },
    performance: { earned: 0, total: 0 },
    viva: { earned: 0, total: 0 },
    labFinal: { earned: 0, total: 0 }
  };

  const ctScores = [];
  const ctTotals = [];
  const assessmentsWithScores = [];

  if (isMultiTeacher && courseType === 'Theory') {
    const assignmentByTeacher = {};
    const assignmentTotalByTeacher = {};

    assessments.forEach((assessment) => {
      const assessmentId = assessment._id.toString();
      const earned = markMap.get(assessmentId) || 0;
      const total = Number(assessment.totalMarks) || 0;
      const buckets = getAssessmentBuckets(assessment, courseType);
      const createdById = assessment.createdBy?._id
        ? assessment.createdBy._id.toString()
        : (assessment.createdBy ? assessment.createdBy.toString() : null);

      if (assessment.type === 'CT') {
        ctScores.push(earned);
        ctTotals.push(total);
      } else if (isAssignmentBucketType(assessment.type) && createdById) {
        if (!assignmentByTeacher[createdById]) {
          assignmentByTeacher[createdById] = 0;
          assignmentTotalByTeacher[createdById] = 0;
        }
        assignmentByTeacher[createdById] += earned;
        assignmentTotalByTeacher[createdById] += total;
      } else {
        buckets.forEach((bucket) => {
          components[bucket].earned += earned;
          components[bucket].total += total;
        });
      }

      assessmentsWithScores.push(buildAssessmentScoreEntry(assessment, earned));
    });

    const teacherAssignKeys = Object.keys(assignmentByTeacher);
    if (teacherAssignKeys.length > 0) {
      let cappedTotal = 0;
      teacherAssignKeys.forEach((tid) => {
        const teacherTotal = assignmentTotalByTeacher[tid] || 0;
        const teacherEarned = assignmentByTeacher[tid] || 0;
        const scaledEarned = teacherTotal > 0 ? (teacherEarned / teacherTotal) * 10 : 0;
        cappedTotal += Math.min(scaledEarned, 10);
      });
      components.assignment.earned = round(cappedTotal / teacherAssignKeys.length, 1);
      components.assignment.total = 10;
    }
  } else {
    assessments.forEach((assessment) => {
      const assessmentId = assessment._id.toString();
      const earned = markMap.get(assessmentId) || 0;
      const total = Number(assessment.totalMarks) || 0;
      const buckets = getAssessmentBuckets(assessment, courseType);

      if (assessment.type === 'CT') {
        ctScores.push(earned);
        ctTotals.push(total);
      } else {
        buckets.forEach((bucket) => {
          components[bucket].earned += earned;
          components[bucket].total += total;
        });
      }

      assessmentsWithScores.push(buildAssessmentScoreEntry(assessment, earned));
    });
  }

  if (ctScores.length > 0) {
    const n = Math.min(3, ctScores.length);
    components.ct.earned = round(calculateBestOfNAverage(ctScores, n), 1);
    components.ct.total = round(calculateBestOfNAverage(ctTotals, n), 1);
  }

  Object.values(components).forEach((component) => {
    component.earned = round(component.earned, 1);
    component.total = round(component.total, 1);
  });

  if (courseType === 'Theory') {
    components.attendance = {
      earned: round(components.attendance.earned, 1),
      total: THEORY_COMPONENT_WEIGHTS.attendance
    };
    components.ct = normalizeComponentToWeight(components.ct, THEORY_COMPONENT_WEIGHTS.ct);
    components.assignment = normalizeComponentToWeight(components.assignment, THEORY_COMPONENT_WEIGHTS.assignment);
    components.final = normalizeComponentToWeight(components.final, THEORY_COMPONENT_WEIGHTS.final);
  }

  return { components, assessmentsWithScores, markMap };
};

const calculateOBEAttainment = (assessments, markMap, classInstance) => {
  const coTotals = {};
  const coScores = {};
  const classMappings = classInstance.coPoMapping || [];

  assessments.forEach((assessment) => {
    if (!assessment.mappedCO) return;
    const co = assessment.mappedCO;
    const assessmentId = assessment._id.toString();
    const total = Number(assessment.totalMarks) || 0;
    const earned = markMap.get(assessmentId) || 0;

    coTotals[co] = (coTotals[co] || 0) + total;
    coScores[co] = (coScores[co] || 0) + earned;
  });

  classMappings.forEach((mapping) => {
    if (!coTotals[mapping.co]) {
      coTotals[mapping.co] = 0;
      coScores[mapping.co] = 0;
    }
  });

  const coEntries = Object.keys(coTotals)
    .sort()
    .reduce((accumulator, co) => {
      const total = coTotals[co];
      const obtained = coScores[co] || 0;
      const percentage = total > 0 ? (obtained / total) * 100 : 0;
      accumulator[co] = {
        obtained: round(obtained, 1),
        max: round(total, 1),
        percentage: round(percentage, 0),
        threshold: OBE_THRESHOLD,
        achieved: percentage >= OBE_THRESHOLD
      };
      return accumulator;
    }, {});

  const poAccumulator = {};

  classMappings.forEach((mapping) => {
    const coData = coEntries[mapping.co];
    if (!coData) return;

    (mapping.po || []).forEach((po) => {
      if (!poAccumulator[po]) {
        poAccumulator[po] = { total: 0, count: 0, obtained: 0, max: 0 };
      }
      poAccumulator[po].total += coData.percentage;
      poAccumulator[po].count += 1;
      poAccumulator[po].obtained += coData.obtained;
      poAccumulator[po].max += coData.max;
    });
  });

  const poEntries = Object.keys(poAccumulator)
    .sort()
    .reduce((accumulator, po) => {
      const data = poAccumulator[po];
      accumulator[po] = {
        percentage: round(data.total / data.count, 0),
        obtained: round(data.obtained, 1),
        max: round(data.max, 1)
      };
      return accumulator;
    }, {});

  return { coEntries, poEntries };
};

// ─── computeStudentMetrics (CQ-3: now a thin orchestrator) ─────

const computeStudentMetrics = ({ enrollment, assessments, classInstance }) => {
  const courseType = classInstance.course?.type || 'Theory';

  const { attendance, multiTeacherAttendance, effectiveAttendanceMarks, isBarred, isMultiTeacher } =
    calculateAttendanceComponent(enrollment, classInstance);

  const { components, assessmentsWithScores, markMap } =
    calculateAssessmentComponents(assessments, enrollment, classInstance, effectiveAttendanceMarks, isMultiTeacher);

  const { coEntries, poEntries } =
    calculateOBEAttainment(assessments, markMap, classInstance);

  const componentKeys = courseType === 'Theory'
    ? ['attendance', 'ct', 'assignment', 'final']
    : ['attendance', 'quiz', 'performance', 'viva', 'labFinal'];

  const totalEarned = componentKeys.reduce((sum, key) => sum + components[key].earned, 0);
  const totalPossible = componentKeys.reduce((sum, key) => sum + components[key].total, 0);

  return {
    attendance,
    multiTeacherAttendance,
    isBarred,
    marks: components,
    total: {
      earned: round(totalEarned, 1),
      total: round(totalPossible, 1)
    },
    obe: coEntries,
    poAttainment: poEntries,
    assessments: assessmentsWithScores
  };
};

// ─── buildClassSummary ─────────────────────────────────────────

const countAssessmentTypes = (assessments) => {
  return assessments.reduce((accumulator, assessment) => {
    switch (assessment.type) {
      case 'CT':
        accumulator.ctsTaken += 1;
        break;
      case 'Assignment':
      case 'Presentation':
      case 'Custom':
        accumulator.assignmentsTaken += 1;
        break;
      case 'Quiz':
        accumulator.quizzesTaken += 1;
        break;
      case 'Report':
        accumulator.reportsTaken += 1;
        break;
      case 'Viva':
        accumulator.vivasTaken += 1;
        break;
      case 'LabFinal':
        accumulator.labFinalsTaken += 1;
        break;
      case 'Final':
        accumulator.finalQuestions += 1;
        break;
      default:
        break;
    }
    return accumulator;
  }, {
    ctsTaken: 0,
    assignmentsTaken: 0,
    quizzesTaken: 0,
    reportsTaken: 0,
    vivasTaken: 0,
    labFinalsTaken: 0,
    finalQuestions: 0
  });
};

const extractAttendanceDates = (enrollments) => {
  const attendanceDates = new Map();

  enrollments.forEach((enrollment) => {
    (enrollment.attendanceRecord || []).forEach((record) => {
      if (record?.date) {
        const dateKey = toDateKey(record.date);
        if (!attendanceDates.has(dateKey)) {
          const takenById = record.takenBy?._id ? record.takenBy._id.toString() : (record.takenBy ? record.takenBy.toString() : null);
          const takenByName = record.takenBy?.name || null;
          attendanceDates.set(dateKey, { takenBy: takenById, takenByName });
        }
      }
    });
  });

  return attendanceDates;
};

const buildClassSummary = async (classInstanceId) => {
  const classInstance = await ensureClassInstance(classInstanceId);
  await syncRegularEnrollmentsForClassInstance(classInstance);

  const [enrollments, assessments] = await Promise.all([
    populateEnrollment(Enrollment.find({ classInstance: classInstance._id })).sort({ createdAt: 1 }),
    Assessment.find({ classInstance: classInstance._id }).populate('createdBy', 'name email').sort({ createdAt: 1, title: 1 })
  ]);

  const roster = enrollments.map((enrollment) => {
    const attendance = buildAttendanceSummary(enrollment.attendanceRecord || []);

    return {
      enrollmentId: enrollment._id,
      studentId: enrollment.student?._id,
      rollNumber: enrollment.student?.rollNumber || '',
      name: enrollment.student?.name || '',
      email: enrollment.student?.email || '',
      type: enrollment.type || 'regular',
      status: enrollment.status || 'active',
      series: enrollment.student?.series,
      section: enrollment.student?.section,
      attendancePercentage: attendance.percentage,
      attendanceCount: attendance.presentCount,
      attendanceClasses: attendance.totalClasses
    };
  });

  const activeRoster = roster.filter((student) => student.status !== 'hidden');
  const attendanceDates = extractAttendanceDates(enrollments);
  const counts = countAssessmentTypes(assessments);

  return {
    classInstance: {
      id: classInstance._id,
      status: classInstance.status,
      series: classInstance.series,
      section: classInstance.section,
      course: classInstance.course,
      teacher: classInstance.teacher,
      teachers: getAssignedTeachers(classInstance),
      coPoMapping: classInstance.coPoMapping || [],
      feedbackQuestions: sanitizeFeedbackQuestions(classInstance.feedbackQuestions),
      feedbackPublished: Boolean(classInstance.feedbackPublished)
    },
    stats: {
      students: activeRoster.length,
      totalRoster: roster.length,
      attendanceClasses: attendanceDates.size,
      attendanceDateDetails: Object.fromEntries(attendanceDates),
      ...counts
    },
    roster,
    assessments
  };
};

// ─── buildClassEvaluation ──────────────────────────────────────

const aggregateClassOBEStats = (studentRows) => {
  const coStats = {};
  const poStats = {};

  studentRows.forEach((row) => {
    Object.entries(row.obe).forEach(([co, data]) => {
      if (!coStats[co]) {
        coStats[co] = { passed: 0, total: 0 };
      }
      coStats[co].total += 1;
      if (data.achieved) {
        coStats[co].passed += 1;
      }
    });

    Object.entries(row.poAttainment).forEach(([po, data]) => {
      if (!poStats[po]) {
        poStats[po] = { passed: 0, total: 0 };
      }
      poStats[po].total += 1;
      if (data.percentage >= OBE_THRESHOLD) {
        poStats[po].passed += 1;
      }
    });
  });

  const coAttainment = Object.keys(coStats)
    .sort()
    .reduce((accumulator, co) => {
      const data = coStats[co];
      const percentage = data.total > 0 ? (data.passed / data.total) * 100 : 0;
      accumulator[co] = {
        percentage: round(percentage, 0),
        kpi: OBE_THRESHOLD,
        achieved: percentage >= OBE_THRESHOLD
      };
      return accumulator;
    }, {});

  const poAttainment = Object.keys(poStats)
    .sort()
    .reduce((accumulator, po) => {
      const data = poStats[po];
      const percentage = data.total > 0 ? (data.passed / data.total) * 100 : 0;
      accumulator[po] = {
        percentage: round(percentage, 0),
        kpi: OBE_THRESHOLD,
        achieved: percentage >= OBE_THRESHOLD
      };
      return accumulator;
    }, {});

  return { coAttainment, poAttainment };
};

const buildClassEvaluation = async (classInstanceId) => {
  const summary = await buildClassSummary(classInstanceId);
  const classInstance = summary.classInstance;
  const assessments = summary.assessments;

  const enrollments = await populateEnrollment(
    Enrollment.find({ classInstance: classInstance.id, status: { $ne: 'hidden' } })
  ).sort({ createdAt: 1 });

  const studentRows = enrollments.map((enrollment) => {
    const metrics = computeStudentMetrics({
      enrollment,
      assessments,
      classInstance
    });

    const row = {
      id: enrollment.student?.rollNumber || enrollment.student?._id?.toString(),
      name: enrollment.student?.name || '',
      att: metrics.marks.attendance.earned,
      ct: metrics.marks.ct.earned,
      assign: metrics.marks.assignment.earned,
      final: metrics.marks.final.earned,
      quiz: metrics.marks.quiz.earned,
      performance: metrics.marks.performance.earned,
      viva: metrics.marks.viva.earned,
      labFinal: metrics.marks.labFinal.earned,
      total: metrics.total.earned,
      gpa: round(getGPA(metrics.total.earned), 2)
    };

    const studentAttainment = { id: row.id, name: row.name };

    Object.entries(metrics.poAttainment).forEach(([po, data]) => {
      studentAttainment[po.toLowerCase()] = data.percentage;
      studentAttainment[`${po.toLowerCase()}_obtained`] = data.obtained;
      studentAttainment[`${po.toLowerCase()}_max`] = data.max;
    });

    Object.entries(metrics.obe).forEach(([co, data]) => {
      studentAttainment[co.toLowerCase()] = data.percentage;
      studentAttainment[`${co.toLowerCase()}_obtained`] = data.obtained;
      studentAttainment[`${co.toLowerCase()}_max`] = data.max;
    });

    return {
      ...row,
      obe: metrics.obe,
      poAttainment: metrics.poAttainment,
      studentAttainment
    };
  });

  const { coAttainment, poAttainment } = aggregateClassOBEStats(studentRows);

  return {
    classInstance,
    marksheet: {
      isTheory: classInstance.course?.type !== 'Sessional',
      rows: studentRows.map((row) => ({
        id: row.id,
        name: row.name,
        att: row.att,
        ct: row.ct,
        assign: row.assign,
        final: row.final,
        quiz: row.quiz,
        performance: row.performance,
        viva: row.viva,
        labFinal: row.labFinal,
        total: row.total,
        gpa: row.gpa
      }))
    },
    obeData: {
      poAttainment,
      coAttainment,
      studentAttainment: studentRows.map((row) => row.studentAttainment)
    }
  };
};

// ─── Student Dashboard ─────────────────────────────────────────

const getStudentDashboardData = async (studentId) => {
  const student = await User.findById(studentId).populate('department', 'name shortName');
  if (!student) {
    throw new Error('Student not found');
  }

  const { populateClassInstance } = require('./teacherHelpers');

  const ClassInstance = require('../models/ClassInstance');
  const matchingInstances = await populateClassInstance(
    ClassInstance.find({
      series: student.series,
      $or: student.section && student.section !== 'N/A'
        ? [{ section: student.section }]
        : [{ section: 'N/A' }, { section: null }, { section: '' }, { section: { $exists: false } }]
    })
  );

  const relevantInstances = matchingInstances.filter((instance) => {
    const departmentId = instance.course?.department?._id?.toString() || instance.course?.department?.toString();
    return departmentId && departmentId === student.department?._id?.toString();
  });

  await Promise.all(relevantInstances.map((instance) => syncRegularEnrollmentsForClassInstance(instance)));

  const enrollments = await populateEnrollment(
    Enrollment.find({ student: student._id, status: { $ne: 'hidden' } })
  ).sort({ createdAt: 1 });

  const assessmentsByClass = {};
  await Promise.all(
    Array.from(new Set(
      enrollments
        .map((enrollment) => enrollment.classInstance?._id?.toString())
        .filter(Boolean)
    )).map(async (classInstanceId) => {
      assessmentsByClass[classInstanceId] = await Assessment.find({ classInstance: classInstanceId }).populate('createdBy', 'name email').sort({ createdAt: 1, title: 1 });
    })
  );

  const runningCourses = [];
  const finishedCourses = [];
  const globalPo = {};

  enrollments.forEach((enrollment) => {
    const classInstance = enrollment.classInstance;
    if (!classInstance?.course) return;

    const metrics = computeStudentMetrics({
      enrollment,
      assessments: assessmentsByClass[classInstance._id.toString()] || [],
      classInstance
    });

    const courseView = {
      id: classInstance._id.toString(),
      classInstanceId: classInstance._id.toString(),
      enrollmentId: enrollment._id.toString(),
      code: classInstance.course.courseCode,
      name: classInstance.course.courseName,
      type: classInstance.course.type,
      series: classInstance.series,
      section: classInstance.section,
      teacher: getAssignedTeacherNames(classInstance),
      teacherEmail: getAssignedTeacherEmails(classInstance),
      teachers: getAssignedTeachers(classInstance),
      attendance: metrics.attendance.percentage,
      attendanceMarks: metrics.multiTeacherAttendance ? metrics.multiTeacherAttendance.averagedMarks : metrics.attendance.marks,
      attendanceLog: metrics.attendance.attendanceLog,
      multiTeacherAttendance: metrics.multiTeacherAttendance,
      isBarred: metrics.isBarred,
      marks: metrics.marks,
      total: metrics.total,
      assessments: metrics.assessments,
      obe: metrics.obe,
      poAttainment: metrics.poAttainment,
      isFinished: classInstance.status === 'Finished'
    };

    Object.entries(metrics.poAttainment).forEach(([po, data]) => {
      if (!globalPo[po]) {
        globalPo[po] = { total: 0, count: 0 };
      }
      globalPo[po].total += data.percentage;
      globalPo[po].count += 1;
    });

    if (classInstance.status === 'Finished') {
      finishedCourses.push(courseView);
    } else {
      runningCourses.push(courseView);
    }
  });

  const globalObe = Object.keys(globalPo)
    .sort()
    .reduce((accumulator, po) => {
      accumulator[po] = round(globalPo[po].total / globalPo[po].count, 0);
      return accumulator;
    }, {});

  const averageAttendance = runningCourses.length > 0
    ? round(runningCourses.reduce((sum, course) => sum + course.attendance, 0) / runningCourses.length, 0)
    : 0;

  return {
    student,
    stats: {
      runningCourses: runningCourses.length,
      finishedCourses: finishedCourses.length,
      averageAttendance
    },
    enrolledCourses: runningCourses,
    finishedCourses,
    globalObe
  };
};

// ─── Exports ───────────────────────────────────────────────────

module.exports = {
  DEFAULT_FEEDBACK_QUESTIONS,
  buildClassSummary,
  buildClassEvaluation,
  getStudentDashboardData,
  sanitizeFeedbackQuestions,
  syncRegularEnrollmentsForClassInstance
};
