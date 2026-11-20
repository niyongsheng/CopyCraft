import { jsPDF } from 'jspdf';
import { captureSheetPages } from './exportPages';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Capture the A4 pages and build a PDF entirely in the browser.
 * This is the web fallback so "下载 PDF" downloads immediately instead of
 * opening the browser print dialog.
 */
export async function createPdfFromPages(): Promise<{ blob: Blob; pages: number }> {
  const captured = await captureSheetPages();
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.setProperties({
    title: 'Copycraft 字帖工坊',
    creator: 'Copycraft',
  });

  captured.forEach((page, index) => {
    if (index > 0) pdf.addPage();
    pdf.addImage(
      page.dataUrl,
      'PNG',
      0,
      0,
      A4_WIDTH_MM,
      A4_HEIGHT_MM,
      undefined,
      'FAST',
    );
  });

  return { blob: pdf.output('blob'), pages: captured.length };
}
