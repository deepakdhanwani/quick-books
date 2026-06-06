import { Platform } from 'react-native';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminReport } from '../services/api';

function ensureWebExport() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('Export is available on the admin web portal only');
  }
}

function downloadBlob(filename: string, blob: Blob) {
  ensureWebExport();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function exportReportCsv(report: AdminReport) {
  const lines: string[] = [];
  lines.push(report.title);
  lines.push(`Generated,${report.generatedAt}`);

  if (Object.keys(report.filters).length > 0) {
    lines.push('');
    lines.push('Filters');
    Object.entries(report.filters).forEach(([key, value]) => {
      lines.push(`${escapeCsvValue(key)},${escapeCsvValue(value)}`);
    });
  }

  if (report.summary.length > 0) {
    lines.push('');
    lines.push('Summary');
    report.summary.forEach((item) => {
      lines.push(`${escapeCsvValue(item.label)},${escapeCsvValue(item.value)}`);
    });
  }

  if (report.chartData.length > 0) {
    lines.push('');
    lines.push('Chart Data');
    lines.push('Label,Value');
    report.chartData.forEach((point) => {
      lines.push(`${escapeCsvValue(point.label)},${point.value}`);
    });
  }

  lines.push('');
  lines.push(report.columns.map((column) => escapeCsvValue(column.label)).join(','));
  report.rows.forEach((row) => {
    lines.push(report.columns.map((column) => escapeCsvValue(String(row[column.key] ?? ''))).join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const filename = `${slugify(report.reportType)}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(filename, blob);
}

export function exportReportPdf(report: AdminReport) {
  ensureWebExport();

  const doc = new jsPDF({ orientation: 'landscape' });
  const generatedAt = new Date(report.generatedAt).toLocaleString('en-IN');

  doc.setFontSize(16);
  doc.text(report.title, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, 14, 24);

  let startY = 30;

  if (Object.keys(report.filters).length > 0) {
    const filterRows = Object.entries(report.filters).map(([key, value]) => [key, value]);
    autoTable(doc, {
      startY,
      head: [['Filter', 'Value']],
      body: filterRows,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [36, 48, 68] },
    });
    startY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
    startY += 8;
  }

  if (report.summary.length > 0) {
    autoTable(doc, {
      startY,
      head: [['Summary', 'Value']],
      body: report.summary.map((item) => [item.label, item.value]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [36, 48, 68] },
    });
    startY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
    startY += 8;
  }

  if (report.chartData.length > 0) {
    autoTable(doc, {
      startY,
      head: [['Chart Label', 'Value']],
      body: report.chartData.map((point) => [point.label, String(point.value)]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    startY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
    startY += 8;
  }

  autoTable(doc, {
    startY,
    head: [report.columns.map((column) => column.label)],
    body: report.rows.map((row) => report.columns.map((column) => String(row[column.key] ?? ''))),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [36, 48, 68] },
  });

  const filename = `${slugify(report.reportType)}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
