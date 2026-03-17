export const getAttendanceMarks = (percentage) => {
  if (percentage >= 90) return 10;
  if (percentage >= 85) return 9;
  if (percentage >= 80) return 8;
  if (percentage >= 75) return 7;
  if (percentage >= 70) return 6;
  if (percentage >= 65) return 5;
  if (percentage >= 60) return 4;
  return 0;
};

export const getAttendanceStatus = (percentage) => {
  if (percentage < 50) return { label: 'Barred', color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' };
  if (percentage < 60) return { label: 'Critical', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' };
  if (percentage < 75) return { label: 'Warning', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' };
  return { label: 'Good', color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' };
};
