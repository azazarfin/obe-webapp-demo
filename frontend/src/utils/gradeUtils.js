export const getGrade = (total) => {
  if (total >= 80) return 'A+';
  if (total >= 75) return 'A';
  if (total >= 70) return 'A-';
  if (total >= 65) return 'B+';
  if (total >= 60) return 'B';
  if (total >= 55) return 'B-';
  if (total >= 50) return 'C+';
  if (total >= 45) return 'C';
  if (total >= 40) return 'D';
  return 'F';
};

export const getGPA = (total) => {
  if (total >= 80) return 4.00;
  if (total >= 75) return 3.75;
  if (total >= 70) return 3.50;
  if (total >= 65) return 3.25;
  if (total >= 60) return 3.00;
  if (total >= 55) return 2.75;
  if (total >= 50) return 2.50;
  if (total >= 45) return 2.25;
  if (total >= 40) return 2.00;
  return 0.00;
};
