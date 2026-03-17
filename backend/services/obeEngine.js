/**
 * OBE Engine Utilities
 * Implements the core business logic described in guidelines.md
 */

/**
 * Calculates the average of the Best N marks from an array of marks.
 * Used for Theory continuous assessments (e.g., Best 3 out of 4 Class Tests).
 * 
 * @param {number[]} marksArray - Array of obtained class test marks (e.g., [15, 12, 18, 10])
 * @param {number} n - Number of top marks to consider (default is 3)
 * @returns {number} Average of the best N marks.
 */
const calculateBestOfNAverage = (marksArray, n = 3) => {
  if (!marksArray || !Array.isArray(marksArray) || marksArray.length === 0) {
    return 0;
  }

  // Filter out invalid values and sort descending
  const validMarks = marksArray.filter(m => typeof m === 'number' && !isNaN(m));
  if (validMarks.length === 0) return 0;

  const sortedDescending = [...validMarks].sort((a, b) => b - a);

  // Take the top N (if array has fewer than N, it takes all available)
  const topN = sortedDescending.slice(0, n);

  // Average them
  const sum = topN.reduce((acc, val) => acc + val, 0);
  return sum / topN.length;
};

/**
 * Calculates Student CO Percentages and Class CO Attainments.
 * 
 * @param {Object} classConfig - { kpiThreshold: 60 } // Default 60% as per standard
 * @param {Array} mappings - Array of max marks and their mapping { questionId, maxMark, mappedCO, mappedPO }
 * @param {Array} studentPerformances - Array of student records { studentId, marks: { questionId: obtainedMark } }
 * @returns {Object} { studentCOs: {...}, classAttainment: {...} }
 */
const calculateClassAttainment = (classConfig, mappings, studentPerformances) => {
  const kpiThreshold = classConfig.kpiThreshold || 60; // Usually 40% or 60%
  
  // 1. Group Max Marks by CO
  const maxMarksByCO = {};
  mappings.forEach(mapping => {
    if (mapping.mappedCO) {
      if (!maxMarksByCO[mapping.mappedCO]) {
        maxMarksByCO[mapping.mappedCO] = 0;
      }
      maxMarksByCO[mapping.mappedCO] += mapping.maxMark;
    }
  });

  const studentResults = [];
  const coPassCounts = {}; // Track how many students passed each CO
  Object.keys(maxMarksByCO).forEach(co => {
    coPassCounts[co] = 0;
  });

  const totalStudents = studentPerformances.length;

  // 2. Calculate Student Attainment
  studentPerformances.forEach(student => {
    const obtainedByCO = {};
    
    // Sum obtained marks per CO
    mappings.forEach(mapping => {
      if (mapping.mappedCO) {
        if (!obtainedByCO[mapping.mappedCO]) {
          obtainedByCO[mapping.mappedCO] = 0;
        }
        const obtained = student.marks[mapping.questionId] || 0;
        obtainedByCO[mapping.mappedCO] += obtained;
      }
    });

    const coAttainments = {};
    // Calculate percentage and check KPI threshold
    Object.keys(maxMarksByCO).forEach(co => {
      const max = maxMarksByCO[co];
      const obtained = obtainedByCO[co] || 0;
      
      let percentage = 0;
      if (max > 0) {
        percentage = (obtained / max) * 100;
      }
      
      const achieved = percentage >= kpiThreshold;
      coAttainments[co] = {
        obtained,
        max,
        percentage,
        achieved
      };

      if (achieved) {
        coPassCounts[co]++;
      }
    });

    studentResults.push({
      studentId: student.studentId,
      coAttainments
    });
  });

  // 3. Calculate Class Overall Attainment
  const classAttainment = {};
  Object.keys(coPassCounts).forEach(co => {
    const passCount = coPassCounts[co];
    const attainmentPercentage = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0;
    
    classAttainment[co] = {
      totalStudents,
      studentsAchieved: passCount,
      attainmentPercentage
    };
  });

  return {
    studentResults,
    classAttainment
  };
};

module.exports = {
  calculateBestOfNAverage,
  calculateClassAttainment
};
