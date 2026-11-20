import { Document, ImageRun, Packer, Paragraph } from 'docx';
import { tGlobal } from '../i18n';
import { capturePageBlobs } from './exportPages';

const A4_WIDTH_TWIPS = 11906;
const A4_HEIGHT_TWIPS = 16838;

/**
 * Capture every A4 page as a high-resolution PNG and pack them into a Word
 * document. Images are used so the printed layout is identical to the preview.
 */
export async function createDocxFromPages(): Promise<{ blob: Blob; pages: number }> {
  const blobs = await capturePageBlobs();
  const images = await Promise.all(
    blobs.map(async (blob) => new Uint8Array(await blob.arrayBuffer())),
  );

  const doc = new Document({
    creator: 'CopyCraft',
    title: tGlobal('app.name'),
    description: `${tGlobal('app.name')} — ${tGlobal('export.worksheetWord')}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        },
        children: images.map(
          (data, index) =>
            new Paragraph({
              pageBreakBefore: index > 0,
              spacing: { before: 0, after: 0, line: 240, lineRule: 'auto' },
              children: [
                new ImageRun({
                  type: 'png',
                  data,
                  transformation: { width: 790, height: 1117 },
                }),
              ],
            }),
        ),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, pages: images.length };
}
