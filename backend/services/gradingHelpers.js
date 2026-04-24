/**
 * Grading and component normalisation helpers extracted from analyticsService.
 *
 * Handles GPA calculation, rounding, component-to-weight normalisation,
 * and course grading constants.
 */

const OBE_THRESHOLD = 50;

const THEORY_COMPONENT_WEIGHTS = {
  attendance: 10,
  ct: 20,
  assignment: 10,
  final: 60
};

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

const getGPA = (total) => {
  if (total >= 80) return 4.0;
  if (total >= 75) return 3.75;
  if (total >= 70) return 3.5;
  if (total >= 65) return 3.25;
  if (total >= 60) return 3.0;
  if (total >= 55) return 2.75;
  if (total >= 50) return 2.5;
  if (total >= 45) return 2.25;
  if (total >= 40) return 2.0;
  return 0;
};

const normalizeComponentToWeight = (component, weight) => {
  const earned = Number(component?.earned) || 0;
  const total = Number(component?.total) || 0;

  if (total <= 0) {
    return {
      earned: 0,
      total: 0
    };
  }

  return {
    earned: round(Math.min((earned / total) * weight, weight), 1),
    total: weight
  };
};

module.exports = {
  OBE_THRESHOLD,
  THEORY_COMPONENT_WEIGHTS,
  round,
  getGPA,
  normalizeComponentToWeight
};
