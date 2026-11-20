import html2canvas from 'html2canvas';
import { tGlobal } from '../i18n';

interface RestoreStyle {
  element: HTMLElement;
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: string;
  backgroundPosition: string;
}

/**
 * html2canvas doesn't tile the SVG data-URL grid reliably. Rasterise each
 * unique grid tile to a PNG and swap it in only for the duration of the
 * capture. This keeps the on-screen preview fast and the export accurate.
 */
async function rasterizeGridBackgrounds(
  pages: HTMLElement[],
): Promise<() => void> {
  const rows = pages.flatMap((page) =>
    Array.from(
      page.querySelectorAll<HTMLElement>('[data-grid-tile]'),
    ),
  );
  const tileCache = new Map<string, Promise<string>>();
  const restores: RestoreStyle[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const computed = getComputedStyle(row);
      if (!computed.backgroundImage.includes('data:image/svg+xml')) return;

      const sizeParts = computed.backgroundSize
        .split(' ')
        .map((part) => Number.parseFloat(part));
      const tileWidth = sizeParts[0] || row.clientWidth;
      const tileHeight = sizeParts[1] || row.clientHeight;
      const imageMatch =
        computed.backgroundImage.match(/url\(["']?(.*?)["']?\)/) ??
        computed.backgroundImage.match(/url\((.*)\)/);
      if (!imageMatch) return;

      const source = imageMatch[1];
      const cacheKey = `${source}|${tileWidth}x${tileHeight}`;
      if (!tileCache.has(cacheKey)) {
        tileCache.set(
          cacheKey,
          (async () => {
            const image = new Image();
            image.src = source;
            await new Promise<void>((resolve) => {
              image.onload = () => resolve();
              image.onerror = () => resolve();
            });
            // Keep the tile at CSS size: the grid strokes are 1 device pixel
            // in the SVG, and html2canvas enlarges the tile at 2× on capture.
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.ceil(tileWidth));
            canvas.height = Math.max(1, Math.ceil(tileHeight));
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
          })(),
        );
      }

      const png = await tileCache.get(cacheKey);
      if (!png) return;

      restores.push({
        element: row,
        backgroundImage: row.style.backgroundImage,
        backgroundSize: row.style.backgroundSize,
        backgroundRepeat: row.style.backgroundRepeat,
        backgroundPosition: row.style.backgroundPosition,
      });
      row.style.backgroundImage = `url("${png}")`;
      row.style.backgroundSize = `${tileWidth}px ${tileHeight}px`;
      row.style.backgroundRepeat = computed.backgroundRepeat;
      row.style.backgroundPosition = computed.backgroundPosition;
    }),
  );

  return () => {
    for (const restore of restores) {
      restore.element.style.backgroundImage = restore.backgroundImage;
      restore.element.style.backgroundSize = restore.backgroundSize;
      restore.element.style.backgroundRepeat = restore.backgroundRepeat;
      restore.element.style.backgroundPosition = restore.backgroundPosition;
    }
  };
}

/**
 * Capture every A4 page as a high-resolution image, encoding each canvas with
 * `encode` so callers only pay for the representation they need.
 */
async function capturePageImages<T>(
  encode: (canvas: HTMLCanvasElement) => Promise<T>,
): Promise<T[]> {
  await document.fonts.ready;

  const pageElements = Array.from(
    document.querySelectorAll<HTMLElement>('.sheet-page'),
  );
  if (pageElements.length === 0) {
    throw new Error(tGlobal('export.noPages'));
  }

  const pagesContainer = document.querySelector<HTMLElement>('.pages');
  const previousZoom = pagesContainer?.style.zoom ?? '';
  const previousStyles = pageElements.map((page) => ({
    boxShadow: page.style.boxShadow,
    borderRadius: page.style.borderRadius,
  }));

  if (pagesContainer) {
    pagesContainer.style.zoom = '1';
    pagesContainer.classList.add('is-exporting-pages');
  }
  pageElements.forEach((page) => {
    page.style.boxShadow = 'none';
    page.style.borderRadius = '0';
  });

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  let restoreGrids: () => void = () => {};
  try {
    restoreGrids = await rasterizeGridBackgrounds(pageElements);
    const pages: T[] = [];
    for (const page of pageElements) {
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      pages.push(await encode(canvas));
    }
    return pages;
  } finally {
    restoreGrids();
    pageElements.forEach((page, index) => {
      page.style.boxShadow = previousStyles[index]?.boxShadow ?? '';
      page.style.borderRadius = previousStyles[index]?.borderRadius ?? '';
    });
    if (pagesContainer) {
      pagesContainer.style.zoom = previousZoom;
      pagesContainer.classList.remove('is-exporting-pages');
    }
  }
}

/** PNG blobs, used by the Word exporter. */
export function capturePageBlobs(): Promise<Blob[]> {
  return capturePageImages(
    (canvas) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result ? resolve(result) : reject(new Error(tGlobal('export.renderFailed'))),
          'image/png',
        );
      }),
  );
}

/** PNG data URLs, used by jsPDF. */
export function capturePageDataUrls(): Promise<string[]> {
  return capturePageImages(async (canvas) => canvas.toDataURL('image/png'));
}
