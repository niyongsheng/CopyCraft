import { jsPDF } from 'jspdf';
import { tGlobal } from '../i18n';
import { capturePageDataUrls } from './exportPages';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Capture the A4 pages and build a PDF entirely in the browser.
 * This is the web fallback so "下载 PDF" downloads immediately instead of
 * opening the browser print dialog.
 */
export async function createPdfFromPages(): Promise<{ blob: Blob; pages: number }> {
  const pages = await capturePageDataUrls();
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.setProperties({
    title: tGlobal('app.name'),
    creator: 'CopyCraft',
  });

  pages.forEach((dataUrl, index) => {
    if (index > 0) pdf.addPage();
    pdf.addImage(
      dataUrl,
      'PNG',
      0,
      0,
      A4_WIDTH_MM,
      A4_HEIGHT_MM,
      undefined,
      'FAST',
    );
  });

  return { blob: pdf.output('blob'), pages: pages.length };
}
