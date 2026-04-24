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

module.exports = {
  calculateBestOfNAverage
};
