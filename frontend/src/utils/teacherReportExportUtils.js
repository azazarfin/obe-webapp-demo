import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Constants for the standard RUET OBE report header.
 */
const MOTTO = "Heaven's Light is Our Guide";
const INSTITUTION = 'RAJSHAHI UNIVERSITY OF ENGINEERING & TECHNOLOGY';

/**
 * The 11 standard instructor self-assessment attributes.
 */
const ATTRIBUTE_LABELS = {
  A: 'Syllabus is modern, outcome based and organized',
  B: 'Course content is adequate, appropriate and outcome based',
  C: 'Course delivery fully covers course content',
  D: 'Teaching-learning is fully outcome based',
  E: 'Teaching-learning method & tools are adequate and effective',
  F: 'Students are fully engaged and interactive in the class',
  G: 'Teaching-learning facilities and resources are adequate and appropriate',
  H: 'Evaluation process is appropriate and OBE based',
  I: 'CO-PO assessment & Attainment process are well defined and appropriate',
  J: 'Students learning outcome is satisfactory',
  K: 'Suggestions provided',
};

/**
 * Groups used for the aggregated summary.
 */
const ATTRIBUTE_GROUPS = [
  { label: 'Syllabus & Course Content', keys: ['A', 'B'] },
  { label: 'Teaching Learning', keys: ['C', 'D', 'E', 'F'] },
  { label: 'Resources', keys: ['G'] },
  { label: 'Assessment', keys: ['H', 'I', 'J', 'K'] },
];

/**
 * CO attainment distribution buckets.
 */
const CO_BUCKETS = [
  { label: 'Excellent (Above 90%)', min: 90, max: 100 },
  { label: 'Very Good (80-89%)', min: 80, max: 89.99 },
  { label: 'Good (60-79%)', min: 60, max: 79.99 },
  { label: 'Satisfactory (40-59%)', min: 40, max: 59.99 },
  { label: 'Unsatisfactory (Below 40%)', min: 0, max: 39.99 },
];

/**
 * Derive the examination text from series and current year.
 * Example: series = 23 → "1st Year Even Semester Examination, 2026 (Session: 2023-24)"
 */
const buildExaminationText = (series, currentYear) => {
  const sessionStart = 2000 + (series || 0);
  const sessionEnd = sessionStart + 1;
  const shortEnd = String(sessionEnd).slice(-2);
  return `Examination, ${currentYear} (Session: ${sessionStart}-${shortEnd})`;
};

/**
 * Calculate CO attainment distribution from student attainment data.
 * @param {Array} studentAttainment - array of student objects with co1, co2, etc (percent values)
 * @param {string[]} coKeys - e.g. ['CO1','CO2']
 * @returns {Object} { CO1: [excellentCount, veryGoodCount, ...], CO2: [...] }
 */
export const calculateCoDistribution = (studentAttainment = [], coKeys = []) => {
  const dist = {};
  coKeys.forEach((co) => {
    dist[co] = CO_BUCKETS.map(() => 0);
  });

  studentAttainment.forEach((student) => {
    coKeys.forEach((co) => {
      const val = student[co.toLowerCase()] ?? 0;
      const bucketIndex = CO_BUCKETS.findIndex((b) => val >= b.min && val <= b.max);
      if (bucketIndex !== -1) {
        dist[co][bucketIndex] += 1;
      }
    });
  });

  return dist;
};

/**
 * Export the full OBE Course Evaluation Report as a multi-section PDF.
 */
export const exportTeacherReportPDF = ({
  classInstance,
  teacher,
  ratings = [],
  courseOutcomes = [],
  suggestions = {},
  obeData = {},
}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 12;

  const center = (text, fontSize, style = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += fontSize * 0.45;
  };

  const sectionHeading = (text) => {
    y += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(30, 112, 195);
    doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(text, margin + 3, y);
    doc.setTextColor(0, 0, 0);
    y += 7;
  };

  const labelValue = (label, value) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}: `, margin, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'N/A'), margin + labelWidth, y);
    y += 5;
  };

  const checkPageBreak = (needed = 30) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 14;
    }
  };

  // ------- Page Header -------
  center(MOTTO, 10, 'italic');
  y += 1;
  center(INSTITUTION, 14, 'bold');
  y += 1;

  const course = classInstance?.course;
  const dept = course?.department;
  if (dept) {
    const facultyLabel = dept.shortName === 'ECE' || dept.shortName === 'EEE' || dept.shortName === 'CSE'
      ? 'Faculty of Electrical & Computer Engineering'
      : `Faculty of Engineering`;
    center(facultyLabel, 10, 'normal');
    center(`Department of ${dept.name || dept.shortName || ''}`, 10, 'normal');
  }
  y += 2;
  center('OBE Course Evaluation Report', 13, 'bold');
  y += 4;

  // ------- Section A: Course Summary -------
  sectionHeading('Section A: Course Summary');
  const currentYear = new Date().getFullYear();
  const series = classInstance?.series || 0;
  const sectionLabel = classInstance?.section === 'N/A' ? '' : `, Section ${classInstance?.section}`;
  labelValue('Program', `B.Sc. in ${dept?.name || 'Engineering'}`);
  labelValue('Course Title', course?.courseName);
  labelValue('Course Code', course?.courseCode);
  labelValue('Instructor', `${teacher?.name || 'N/A'}${teacher?.designation ? ', ' + teacher.designation : ''}`);
  labelValue('Examination', buildExaminationText(series, currentYear) + sectionLabel);

  // ------- Section B: Course Outcomes -------
  checkPageBreak(30);
  sectionHeading('Section B: Course Outcomes (COs)');
  if (courseOutcomes.length > 0) {
    courseOutcomes.forEach((co) => {
      checkPageBreak(12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${co.code}: `, margin, y);
      const codeWidth = doc.getTextWidth(`${co.code}: `);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(co.description || 'N/A', pageWidth - 2 * margin - codeWidth);
      doc.text(descLines, margin + codeWidth, y);
      y += descLines.length * 4.5;
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('No course outcomes defined.', margin, y);
    y += 5;
  }

  // ------- Section E: Instructor Feedback (A-K) -------
  checkPageBreak(50);
  sectionHeading('Section E: Instructor Feedback (Attributes A–K)');

  const ratingsMap = {};
  ratings.forEach((r) => { ratingsMap[r.attribute] = r.score; });

  const feedbackRows = Object.entries(ATTRIBUTE_LABELS).map(([key, desc]) => {
    const score = ratingsMap[key];
    if (key === 'K') {
      return [key, desc, (suggestions?.syllabus || suggestions?.teaching || suggestions?.resources || suggestions?.assessment) ? 'Yes' : 'No'];
    }
    return [key, desc, score != null ? String(score) : '-'];
  });

  autoTable(doc, {
    startY: y,
    head: [['Attribute', 'Description', 'Rating (1–5)']],
    body: feedbackRows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 112, 195], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 120 },
      2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
  });
  y = doc.lastAutoTable.finalY + 6;

  // ------- Aggregated Summary -------
  checkPageBreak(40);
  sectionHeading('Instructor Feedback Summary (Aggregated)');

  const summaryRows = ATTRIBUTE_GROUPS.map((group) => {
    const scores = group.keys
      .map((k) => ratingsMap[k])
      .filter((v) => v != null && typeof v === 'number');
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return [
      group.label,
      `Attributes ${group.keys.join(', ')}`,
      avg > 0 ? avg.toFixed(1) : '-',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Attributes', 'Rating']],
    body: summaryRows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 112, 195], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'center', fontStyle: 'bold' } },
    margin: { left: margin, right: margin },
  });
  y = doc.lastAutoTable.finalY + 6;

  // ------- Improvement Plan -------
  checkPageBreak(50);
  sectionHeading('Section E: Improvement Plan');

  const planSections = [
    { label: 'Syllabus & Course Content', text: suggestions?.syllabus },
    { label: 'Teaching Learning', text: suggestions?.teaching },
    { label: 'Resources', text: suggestions?.resources },
    { label: 'Assessment', text: suggestions?.assessment },
  ];

  planSections.forEach((section) => {
    checkPageBreak(18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${section.label}:`, margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(section.text || 'No comments provided.', pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 3;
  });

  // ------- CO Attainment Statistics Table -------
  const coKeys = Object.keys(obeData?.coAttainment || {}).sort();
  if (coKeys.length > 0 && obeData?.studentAttainment?.length > 0) {
    checkPageBreak(50);
    sectionHeading('CO Attainment Distribution');

    const dist = calculateCoDistribution(obeData.studentAttainment, coKeys);

    const distHeaders = ['Grade Band', ...coKeys];
    const distRows = CO_BUCKETS.map((bucket, idx) => [
      bucket.label,
      ...coKeys.map((co) => String(dist[co][idx])),
    ]);

    autoTable(doc, {
      startY: y,
      head: [distHeaders],
      body: distRows,
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
      headStyles: { fillColor: [30, 112, 195], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 55 } },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ------- CO/PO Class Attainment Summary -------
  const poKeys = Object.keys(obeData?.poAttainment || {}).sort();
  if (coKeys.length > 0 || poKeys.length > 0) {
    checkPageBreak(40);
    sectionHeading('Class CO/PO Attainment Summary');

    const attRows = [];
    coKeys.forEach((co) => {
      const d = obeData.coAttainment[co];
      attRows.push([co, `${d.percentage}%`, `${d.kpi}%`, d.achieved ? 'MET' : 'FAILED']);
    });
    poKeys.forEach((po) => {
      const d = obeData.poAttainment[po];
      attRows.push([po, `${d.percentage}%`, `${d.kpi}%`, d.achieved ? 'MET' : 'FAILED']);
    });

    autoTable(doc, {
      startY: y,
      head: [['Outcome', 'Attainment (%)', 'Threshold (%)', 'Status']],
      body: attRows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 112, 195], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.cell.raw === 'MET' ? [0, 128, 0] : [200, 0, 0];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ------- Signature line -------
  checkPageBreak(25);
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('_________________________________', pageWidth - margin - 65, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(teacher?.name || 'Instructor', pageWidth - margin - 65, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  if (teacher?.designation) {
    doc.text(teacher.designation, pageWidth - margin - 65, y);
    y += 4;
  }
  if (dept) {
    doc.text(`${dept.shortName || dept.name}, RUET`, pageWidth - margin - 65, y);
  }

  // Save
  const filename = `OBE_Course_Evaluation_${course?.courseCode || 'report'}.pdf`;
  doc.save(filename);
};

export { ATTRIBUTE_LABELS, ATTRIBUTE_GROUPS, CO_BUCKETS };
