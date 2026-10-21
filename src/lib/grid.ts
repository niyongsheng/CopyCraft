import type { GridStyleId, SheetSettings } from '../types';

interface TileOptions {
  borderColor: string;
  lineColor: string;
  showBorder: boolean;
  pinyinRatio?: number;
}

export interface GridLineShape {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GridRectShape {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GridShape = GridLineShape | GridRectShape;

export interface GridRule {
  y: number;
  solid: boolean;
}

export interface GridGeometry {
  /** Dashed interior guides, in 0–100 coordinates. */
  guides: GridShape[];
  /** Horizontal rules used by the four-line and line styles. */
  rules: GridRule[];
  /** Dashed right edge used by the four-line and line styles. */
  dashedEdge?: { opacity: number };
  /** Extra rules shown only in the compact picker preview. */
  iconRules: number[];
}

/**
 * Normalized geometry for every grid style. The tile renderer and the picker
 * icon both derive from this so the two representations cannot drift.
 */
export function gridGeometry(style: GridStyleId, y0 = 0): GridGeometry {
  const midY = y0 + (100 - y0) / 2;
  const guides: GridShape[] = [];
  const rules: GridRule[] = [];
  const iconRules: number[] = [];
  let dashedEdge: { opacity: number } | undefined;

  if (style === 'fourline') {
    rules.push(
      { y: 0.5, solid: true },
      { y: 33.3, solid: false },
      { y: 66.6, solid: false },
      { y: 99.5, solid: true },
    );
    dashedEdge = { opacity: 0.7 };
  } else if (style === 'line') {
    rules.push({ y: 99.5, solid: true });
    dashedEdge = { opacity: 0.55 };
    iconRules.push(33.3, 66.6);
  } else {
    if (style === 'tian' || style === 'mi' || style === 'tianhui') {
      guides.push({ kind: 'line', x1: 50, y1: y0, x2: 50, y2: 100 });
      guides.push({ kind: 'line', x1: 0, y1: midY, x2: 100, y2: midY });
    }
    if (style === 'mi') {
      guides.push({ kind: 'line', x1: 0, y1: y0, x2: 100, y2: 100 });
      guides.push({ kind: 'line', x1: 100, y1: y0, x2: 0, y2: 100 });
    }
    if (style === 'huigong' || style === 'tianhui') {
      guides.push({
        kind: 'rect',
        x: 18,
        y: 18 + y0 * 0.82,
        width: 64,
        height: 64 - y0 * 0.18,
      });
    }
    if (style === 'jiugong') {
      const upper = y0 + (100 - y0) / 3;
      const lower = y0 + ((100 - y0) * 2) / 3;
      guides.push({ kind: 'line', x1: 33.3, y1: y0, x2: 33.3, y2: 100 });
      guides.push({ kind: 'line', x1: 66.6, y1: y0, x2: 66.6, y2: 100 });
      guides.push({ kind: 'line', x1: 0, y1: upper, x2: 100, y2: upper });
      guides.push({ kind: 'line', x1: 0, y1: lower, x2: 100, y2: lower });
    }
  }

  return { guides, rules, dashedEdge, iconRules };
}

const cache = new Map<string, string>();

const enc = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/**
 * A single repeating grid cell, drawn as an SVG data URI. The tile draws the
 * right/bottom edges only so adjacent cells share a single hairline.
 */
export function gridTile(style: GridStyleId, opts: TileOptions): string {
  const key = `${style}|${opts.borderColor}|${opts.lineColor}|${opts.showBorder}|${opts.pinyinRatio ?? 0}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const solid = opts.showBorder ? opts.borderColor : 'none';
  const hair = opts.showBorder ? 0.9 : 0;
  const p = Math.max(0, Math.min(0.6, opts.pinyinRatio ?? 0));
  const y0 = p * 100;
  const geometry = gridGeometry(style, y0);
  const dash = `stroke="${opts.lineColor}" stroke-width="0.9" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" fill="none"`;
  const guide = (shape: GridShape) =>
    shape.kind === 'line'
      ? `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" ${dash}/>`
      : `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${dash}/>`;

  let content = '';

  if (geometry.rules.length > 0) {
    content = geometry.rules
      .map(
        (rule) =>
          `<line x1="0" y1="${rule.y}" x2="100" y2="${rule.y}" stroke="${rule.solid ? opts.borderColor : opts.lineColor}" stroke-width="${rule.solid ? 1 : 0.9}"${rule.solid ? '' : ' stroke-dasharray="5 4"'} vector-effect="non-scaling-stroke"/>`,
      )
      .join('\n');
    if (geometry.dashedEdge) {
      content += `\n<line x1="99.5" y1="0" x2="99.5" y2="100" stroke="${opts.lineColor}" stroke-width="0.8" stroke-dasharray="3 5" opacity="${geometry.dashedEdge.opacity}" vector-effect="non-scaling-stroke"/>`;
    }
  } else {
    const pinyinLine =
      p > 0
        ? `<line x1="0" y1="${y0}" x2="100" y2="${y0}" stroke="${opts.borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>`
        : '';
    const edges = opts.showBorder
      ? `<line x1="99.5" y1="0" x2="99.5" y2="100" stroke="${solid}" stroke-width="${hair}" vector-effect="non-scaling-stroke"/>
      <line x1="0" y1="99.5" x2="100" y2="99.5" stroke="${solid}" stroke-width="${hair}" vector-effect="non-scaling-stroke"/>`
      : '';
    content = `${pinyinLine}\n${geometry.guides.map(guide).join('\n')}\n${edges}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${content}</svg>`;
  const url = enc(svg);
  cache.set(key, url);
  return url;
}

/** Inset hairline around the grid frame, or `none` when borders are hidden. */
export function frameShadowFor(
  settings: Pick<SheetSettings, 'showBorder' | 'borderColor'>,
): string {
  return settings.showBorder
    ? `inset 1.5px 0 0 0 ${settings.borderColor}, inset 0 1.5px 0 0 ${settings.borderColor}, inset -1.5px 0 0 0 ${settings.borderColor}`
    : 'none';
}

/** Props for a row of cells painted with a tiled grid. */
export function rowGridStyle(style: GridStyleId, opts: TileOptions, cellW: number, rowH: number) {
  return {
    backgroundImage: gridTile(style, opts),
    backgroundSize: `${cellW}px ${rowH}px`,
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'left top',
  } as const;
}
