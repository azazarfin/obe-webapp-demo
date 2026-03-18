import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (headers, rows, filename = 'report') => {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      String(h).length,
      ...rows.map(r => String(r[i] || '').length)
    );
    return { wch: maxLen + 2 };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (title, subtitle, headers, rows, filename = 'report') => {
  const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 28);
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 34 : 28,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 112, 195], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
};
