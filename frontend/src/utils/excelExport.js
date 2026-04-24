import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const LABEL_MAP = {
  1: 'Poor',
  2: 'Fair',
  3: 'Satisfactory',
  4: 'Very good',
  5: 'Excellent'
};

const getBackgroundColor = (colIndex) => {
  if (colIndex === 1) return 'FFBDD7EE'; // Category column: light blue
  if (colIndex === 2) return 'FFF8CBAD'; // Level of effort: peach
  if (colIndex >= 3 && colIndex <= 5) return 'FFC6E0B4'; // Part I: green
  if (colIndex >= 6 && colIndex <= 7) return 'FFBDD7EE'; // Part II: blue
  if (colIndex === 8) return 'FFE4DFEC'; // Suggestions: purple
  return 'FFFFFFFF';
};

const getHeaderBackgroundColor = (colIndex) => {
  if (colIndex === 1) return 'FF9BC2E6'; 
  if (colIndex === 2) return 'FFF4B084'; 
  if (colIndex >= 3 && colIndex <= 5) return 'FFA9D08E'; 
  if (colIndex >= 6 && colIndex <= 7) return 'FF9BC2E6'; 
  if (colIndex === 8) return 'FFCCC1D9'; 
  return 'FFFFFFFF';
};

export const exportFeedbackToExcel = async (feedbacks, questions, courseName) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Feedback Report');

  // 1. Calculate stats
  const stats = {};
  questions.forEach((q, idx) => {
    stats[idx] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, sum: 0, count: 0 };
  });

  feedbacks.forEach(f => {
    f.ratings.forEach(r => {
      const qIndex = questions.indexOf(r.attribute);
      if (qIndex !== -1 && r.score >= 1 && r.score <= 5) {
        stats[qIndex][r.score]++;
        stats[qIndex].sum += r.score;
        stats[qIndex].count++;
      }
    });
  });

  const getOverall = (qIndex) => {
    if (stats[qIndex].count === 0) return '0.00';
    return (stats[qIndex].sum / stats[qIndex].count).toFixed(2);
  };

  // Define top row headers
  const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const topHeaders = ['Category'];
  questions.forEach((q, i) => {
    topHeaders.push(`${columnLetters[i]}. ${q} [Overall: ${getOverall(i)}]`);
  });
  topHeaders.push('Suggestions');

  const headerRow = sheet.addRow(topHeaders);
  
  // Style headers
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: getHeaderBackgroundColor(colNumber) }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  headerRow.height = 100;

  // Set column widths
  sheet.getColumn(1).width = 20; // Category / Timestamp
  sheet.getColumn(2).width = 20; // Q1
  sheet.getColumn(3).width = 20; // Q2
  sheet.getColumn(4).width = 20; // Q3
  sheet.getColumn(5).width = 20; // Q4
  sheet.getColumn(6).width = 20; // Q5
  sheet.getColumn(7).width = 20; // Q6
  sheet.getColumn(8).width = 40; // Suggestions

  // Add stat rows (Poor, Fair, Satisfactory, Very good, Excellent)
  [1, 2, 3, 4, 5].forEach(score => {
    const rowData = [LABEL_MAP[score]];
    questions.forEach((q, i) => {
      rowData.push(stats[i][score]);
    });
    rowData.push(''); // Empty for suggestions
    const row = sheet.addRow(rowData);
    
    row.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      if (colNumber === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White for category labels
      } else if (colNumber <= 7) {
        const bg = getBackgroundColor(colNumber);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Add Overall Row
  const overallRowData = ['Overall'];
  questions.forEach((q, i) => {
    overallRowData.push(getOverall(i));
  });
  overallRowData.push('');
  const overallRow = sheet.addRow(overallRowData);
  overallRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Empty row
  sheet.addRow([]);

  // Raw data header row
  const rawDataHeaderRow = sheet.addRow([
    'Timestamp',
    'Level of effort',
    'PART I: Course Contents',
    '',
    '',
    'PART II: Assessment Policy',
    '',
    'Suggestions'
  ]);

  sheet.mergeCells(`C${rawDataHeaderRow.number}:E${rawDataHeaderRow.number}`);
  sheet.mergeCells(`F${rawDataHeaderRow.number}:G${rawDataHeaderRow.number}`);

  rawDataHeaderRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    let bg = 'FF2F75B5'; // Default dark blue
    if (colNumber >= 3 && colNumber <= 5) bg = 'FF548235'; // Dark Green for PART I
    if (colNumber >= 6 && colNumber <= 7) bg = 'FF2F75B5'; // Dark Blue for PART II
    if (colNumber === 8) bg = 'FF7030A0'; // Purple for Suggestions
    
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Format the raw data
  feedbacks.forEach(f => {
    const d = new Date(f.timestamp);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    const rowData = [dateStr];
    
    questions.forEach(q => {
      const rating = f.ratings.find(r => r.attribute === q);
      rowData.push(rating ? LABEL_MAP[rating.score] : '');
    });
    rowData.push(f.suggestions || '');

    const row = sheet.addRow(rowData);
    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center' };
      if (colNumber > 1 && colNumber <= 7) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: getBackgroundColor(colNumber) } };
      }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Feedback_Report_${courseName.replace(/\s+/g, '_')}.xlsx`);
};
