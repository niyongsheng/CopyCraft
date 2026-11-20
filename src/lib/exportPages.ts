import html2canvas from 'html2canvas';

interface RestoreStyle {
  element: HTMLElement;
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: string;
  backgroundPosition: string;
}

export interface CapturedPage {
  /** PNG blob, used by the Word exporter. */
  blob: Blob;
  /** PNG data URL, used by jsPDF. */
  dataUrl: string;
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
      page.querySelectorAll<HTMLElement>(
        '.grid-row, .fourline-row, .poem-line, .poem-column',
      ),
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

/** Capture every A4 page as a high-resolution PNG. */
export async function captureSheetPages(): Promise<CapturedPage[]> {
  await document.fonts.ready;

  const pageElements = Array.from(
    document.querySelectorAll<HTMLElement>('.sheet-page'),
  );
  if (pageElements.length === 0) {
    throw new Error('当前视图没有可导出的字帖');
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
    const pages: CapturedPage[] = [];
    for (const page of pageElements) {
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('页面渲染失败'))),
          'image/png',
        );
      });
      pages.push({ blob, dataUrl: canvas.toDataURL('image/png') });
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
