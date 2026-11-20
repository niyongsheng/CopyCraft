import { abacusViewBox } from './abacus';
import { PAGE_HEIGHT, PAGE_WIDTH, SHEET_BY_ID } from './constants';
import { fontStack } from './fonts';
import type { CharData } from './hanziData';
import { measureText } from './measure';
import { isHan, pinyinOf, uniqueHanChars } from './pinyin';
import { generateAbacus, type AbacusProblemData } from './generators/abacus';
import { generateClocks } from './generators/clock';
import {
  generateExpression,
  type ExpressionProblemData,
} from './generators/expression';
import { generateMath, generateVertical } from './generators/math';
import { PATTERNS } from './generators/patterns';
import type {
  ClockProblem,
  Problem,
  SheetSettings,
  SheetType,
  VerticalProblem,
} from '../types';

export interface Metrics {
  contentW: number;
  contentH: number;
  titleH: number;
}

export interface CellModel {
  text: string;
  pinyin: string;
  model: boolean;
  /** Word sheets render the head character large and its words smaller. */
  role?: 'char' | 'word';
}

export interface GridRowModel {
  cells: CellModel[];
}

export interface GridPageModel {
  rows: GridRowModel[];
}

export interface GridModel {
  kind: 'grid';
  metrics: Metrics;
  cellW: number;
  rowH: number;
  pinyinH: number;
  charPx: number;
  cols: number;
  pages: GridPageModel[];
}

export interface NameStrokeCell {
  kind: 'stage' | 'repeat' | 'empty';
  char: string;
  stage: number;
  label: string;
}

export interface NameStrokeRow {
  cells: NameStrokeCell[];
}

export interface NameStrokeModel {
  kind: 'name-stroke';
  metrics: Metrics;
  cellW: number;
  rowH: number;
  pinyinH: number;
  charPx: number;
  cols: number;
  pages: { rows: NameStrokeRow[] }[];
  strokeData: Record<string, CharData>;
}

export interface FourLineRowModel {
  text: string;
  repeatCount: number;
  paragraph: boolean;
  empty: boolean;
  meaning?: string;
}

export interface FourLinePageModel {
  rows: FourLineRowModel[];
}

export interface FourLineModel {
  kind: 'fourline';
  metrics: Metrics;
  cellW: number;
  rowH: number;
  charPx: number;
  gap: number;
  pages: FourLinePageModel[];
}

export interface PenModel {
  kind: 'pen';
  metrics: Metrics;
  cellW: number;
  rowH: number;
  cols: number;
  rows: string[];
}

export interface MathModel {
  kind: 'math';
  metrics: Metrics;
  fontPx: number;
  rowHeight: number;
  cols: number;
  pages: Problem[][];
}

export interface VerticalModel {
  kind: 'vertical';
  metrics: Metrics;
  fontPx: number;
  blockHeight: number;
  cols: number;
  pages: VerticalProblem[][];
}

export interface PoemModel {
  kind: 'poem';
  metrics: Metrics;
  vertical: boolean;
  showPinyin: boolean;
  showAuthor: boolean;
  title: string;
  author: string;
  lines: string[];
  notes: string[];
  showNotes: boolean;
  cellSize: number;
  pinyinH: number;
  pinyinSize: number;
}

export interface ExpressionModel {
  kind: 'expression';
  metrics: Metrics;
  fontPx: number;
  cols: number;
  blockHeight: number;
  steps: number;
  pages: ExpressionProblemData[][];
}

export interface AbacusModel {
  kind: 'abacus';
  metrics: Metrics;
  mode: 'read' | 'draw' | 'calc';
  rods: number;
  cols: number;
  blockHeight: number;
  abacusWidth: number;
  fontPx: number;
  pages: AbacusProblemData[][];
}

export interface ClockModel {
  kind: 'clock';
  metrics: Metrics;
  cols: number;
  clockSize: number;
  labelSize: number;
  rowHeight: number;
  pages: ClockProblem[][];
}

export type SheetModel =
  | GridModel
  | NameStrokeModel
  | FourLineModel
  | PenModel
  | MathModel
  | VerticalModel
  | ExpressionModel
  | PoemModel
  | AbacusModel
  | ClockModel;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function metricsFor(settings: SheetSettings): Metrics {
  const titleH = settings.showTitle ? settings.titleHeight : 0;
  return {
    contentW: Math.max(80, PAGE_WIDTH - settings.hMargin * 2),
    contentH: Math.max(80, PAGE_HEIGHT - settings.vMargin * 2 - titleH),
    titleH,
  };
}

function blankRow(cols: number): GridRowModel {
  return {
    cells: Array.from({ length: cols }, () => ({ text: '', pinyin: '', model: false })),
  };
}

/** Split rows into pages, padding the last page with blank rows. */
function paginate<T>(rows: T[], rowsPerPage: number, makeBlank: () => T): T[][] {
  if (rows.length === 0) rows = [makeBlank()];
  const pages = chunk(rows, rowsPerPage);
  const last = pages[pages.length - 1];
  while (last.length < rowsPerPage) last.push(makeBlank());
  return pages;
}

/** Split generated problems into pages, always yielding at least one page. */
function chunkPages<T>(items: T[], perPage: number): T[][] {
  const pages = chunk(items, perPage);
  return pages.length > 0 ? pages : [[]];
}

interface GridLayout {
  metrics: Metrics;
  cols: number;
  cellW: number;
  pinyinH: number;
  rowH: number;
  rowsPerPage: number;
  charPx: number;
}

/** Geometry shared by every grid-based model. */
function gridLayout(settings: SheetSettings, showPinyin: boolean): GridLayout {
  const metrics = metricsFor(settings);
  const cols = Math.max(1, Math.floor(metrics.contentW / Math.max(12, settings.gridSize)));
  const cellW = metrics.contentW / cols;
  const pinyinH = showPinyin ? Math.round(cellW * 0.42) : 0;
  const rowH = cellW + pinyinH;
  const pitch = rowH + settings.lineSpacing;
  const rowsPerPage = Math.max(1, Math.floor((metrics.contentH + settings.lineSpacing) / pitch));
  const charPx = cellW * (settings.fontSize / 100) * 0.9;
  return { metrics, cols, cellW, pinyinH, rowH, rowsPerPage, charPx };
}

function buildGridModel(
  type: SheetType,
  settings: SheetSettings,
  content: string,
): GridModel {
  if (type === 'hanziWords') return buildWordGridModel(settings, content);
  if (type === 'dictation') return buildDictationModel(settings, content);
  if (type === 'blank') return buildBlankModel(settings);

  const showPinyin = settings.showPinyin && (type === 'hanzi' || type === 'name');
  const { metrics, cols, cellW, pinyinH, rowH, rowsPerPage, charPx } = gridLayout(
    settings,
    showPinyin,
  );
  const paragraph = type === 'hanziParagraph';

  const blank = () => blankRow(cols);
  const rows: GridRowModel[] = [];

  if (paragraph) {
    const all = Array.from(content.replace(/\s+/g, ''));
    if (all.length === 0) {
      rows.push(blank());
    } else {
      for (let i = 0; i < all.length; i += cols) {
        const slice = all.slice(i, i + cols);
        const cells: CellModel[] = slice.map((ch) => ({
          text: ch,
          pinyin: pinyinOf(ch),
          model: false,
        }));
        while (cells.length < cols) cells.push({ text: '', pinyin: '', model: false });
        rows.push({ cells });
      }
    }
  } else {
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const tokens = Array.from(line).filter((t) => t !== ' ' && t !== '\t');
      if (tokens.length === 0) continue;

      if (type === 'name' && settings.nameNoRepeat) {
        const tokenCells: CellModel[] = tokens.map((token) => ({
          text: token,
          pinyin: showPinyin ? pinyinOf(token) : '',
          model: true,
        }));
        for (let i = 0; i < tokenCells.length; i += cols) {
          const cells = tokenCells.slice(i, i + cols);
          while (cells.length < cols) cells.push({ text: '', pinyin: '', model: false });
          rows.push({ cells });
        }
        continue;
      }

      const cells: CellModel[] = [];
      for (let i = 0; i < cols; i += 1) {
        const token = tokens[i % tokens.length];
        cells.push({
          text: token,
          pinyin: showPinyin ? pinyinOf(token) : '',
          model: i < tokens.length,
        });
      }
      rows.push({ cells });
    }
    if (rows.length === 0) rows.push(blank());
  }

  return {
    kind: 'grid',
    metrics,
    cellW,
    rowH,
    pinyinH,
    charPx,
    cols,
    pages: paginate(rows, rowsPerPage, blank).map((pageRows) => ({ rows: pageRows })),
  };
}

/** 看拼音写词语 / 生字默写 / 听写纸：词语只提供拼音和空格。 */
function buildDictationModel(settings: SheetSettings, content: string): GridModel {
  const showPinyin = settings.showPinyin;
  const { metrics, cols, cellW, pinyinH, rowH, rowsPerPage, charPx } = gridLayout(
    settings,
    showPinyin,
  );
  const blank = () => blankRow(cols);
  const rows: GridRowModel[] = [];

  for (const line of content.split('\n')) {
    const chars = Array.from(line.trim()).filter((char) => char.trim() !== '');
    if (chars.length === 0) continue;
    const cells: CellModel[] = chars.map((char) => ({
      text: '',
      pinyin: showPinyin ? pinyinOf(char) : '',
      model: false,
    }));
    while (cells.length < cols) cells.push({ text: '', pinyin: '', model: false });
    rows.push({ cells: cells.slice(0, cols) });
  }

  if (rows.length === 0) rows.push(blank());

  return {
    kind: 'grid',
    metrics,
    cellW,
    rowH,
    pinyinH,
    charPx,
    cols,
    pages: paginate(rows, rowsPerPage, blank).map((pageRows) => ({ rows: pageRows })),
  };
}

/** 空白练习纸：整页空白格子，仅由格子样式和标题决定。 */
function buildBlankModel(settings: SheetSettings): GridModel {
  const { metrics, cols, cellW, rowH, pinyinH, rowsPerPage, charPx } = gridLayout(
    settings,
    false,
  );
  const blank = () => blankRow(cols);
  const rows: GridRowModel[] = Array.from({ length: rowsPerPage }, blank);
  return {
    kind: 'grid',
    metrics,
    cellW,
    rowH,
    pinyinH,
    charPx,
    cols,
    pages: [{ rows }],
  };
}

const WORD_SLOTS_MAX = 3;

function pinyinLabel(text: string): string {
  const parts = Array.from(text)
    .map((char) => pinyinOf(char))
    .filter(Boolean);
  return parts.join(' ');
}

/**
 * 生字组词帖：每行一个「生字 + 词语」条目，条目在整行重复铺满。
 * 首组生字用墨色，其余组和词语用描红色，形成「看一个、描一串」的节奏。
 */
function buildWordGridModel(settings: SheetSettings, content: string): GridModel {
  const showPinyin = settings.showPinyin;
  const { metrics, cols, cellW, pinyinH, rowH, rowsPerPage, charPx } = gridLayout(
    settings,
    showPinyin,
  );

  const entries = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tokens = line.split(/\s+/).filter(Boolean);
      return {
        head: tokens[0] ?? '',
        words: tokens.slice(1, 1 + WORD_SLOTS_MAX),
      };
    })
    .filter((entry) => entry.head.length > 0);

  const wordSlots = Math.max(1, ...entries.map((entry) => entry.words.length));
  const groupW = 1 + wordSlots;
  const groupsPerRow = Math.max(1, Math.floor(cols / groupW));

  const makeGroup = (entry: (typeof entries)[number], first: boolean): CellModel[] => {
    const cells: CellModel[] = [
      {
        text: entry.head,
        pinyin: showPinyin ? pinyinLabel(entry.head) : '',
        model: first,
        role: 'char',
      },
    ];
    for (let i = 0; i < wordSlots; i += 1) {
      cells.push({
        text: entry.words[i] ?? '',
        pinyin: '',
        model: false,
        role: 'word',
      });
    }
    return cells;
  };

  const blank = () => blankRow(cols);
  const rows: GridRowModel[] = entries.length
    ? entries.map((entry) => {
        const cells: CellModel[] = [];
        for (let i = 0; i < groupsPerRow; i += 1) {
          cells.push(...makeGroup(entry, i === 0));
        }
        while (cells.length < cols) cells.push({ text: '', pinyin: '', model: false });
        return { cells: cells.slice(0, cols) };
      })
    : [blank()];

  return {
    kind: 'grid',
    metrics,
    cellW,
    rowH,
    pinyinH,
    charPx,
    cols,
    pages: paginate(rows, rowsPerPage, blank).map((pageRows) => ({ rows: pageRows })),
  };
}

function emptyNameCell(): NameStrokeCell {
  return { kind: 'empty', char: '', stage: 0, label: '' };
}

function blankNameStrokeRow(cols: number): NameStrokeRow {
  return { cells: Array.from({ length: cols }, () => emptyNameCell()) };
}

function buildNameStrokeModel(
  settings: SheetSettings,
  content: string,
  strokeData: Record<string, CharData>,
): NameStrokeModel {
  const showPinyin = settings.showPinyin;
  const { metrics, cols, cellW, pinyinH, rowH, rowsPerPage, charPx } = gridLayout(
    settings,
    showPinyin,
  );
  const fillTrailing = !settings.nameTruncateAfterStrokes && !settings.nameNoRepeat;

  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: NameStrokeRow[] = [];

  for (const line of lines) {
    const tokens = Array.from(line).filter((t) => t !== ' ' && t !== '\t');
    if (tokens.length === 0) continue;

    const sequence: NameStrokeCell[] = [];
    for (const token of tokens) {
      const data = isHan(token) ? strokeData[token] : undefined;
      if (data && data.strokes.length > 0) {
        const total = data.strokes.length;
        const py = pinyinOf(token);
        for (let stage = 1; stage <= total; stage += 1) {
          sequence.push({
            kind: 'stage',
            char: token,
            stage,
            label: stage === 1 ? py : `${stage}/${total}`,
          });
        }
      } else {
        sequence.push({ kind: 'stage', char: token, stage: 0, label: '' });
      }
    }

    for (let start = 0; start < sequence.length; start += cols) {
      const cells = sequence.slice(start, start + cols);
      const isLastChunk = start + cols >= sequence.length;
      let repeatIndex = 0;
      while (cells.length < cols) {
        if (isLastChunk && fillTrailing) {
          const token = tokens[repeatIndex % tokens.length];
          repeatIndex += 1;
          cells.push({
            kind: 'repeat',
            char: token,
            stage: 0,
            label: showPinyin ? pinyinOf(token) : '',
          });
        } else {
          cells.push(emptyNameCell());
        }
      }
      rows.push({ cells });
    }
  }

  const pages = paginate(rows, rowsPerPage, () => blankNameStrokeRow(cols)).map(
    (pageRows) => ({ rows: pageRows }),
  );

  return {
    kind: 'name-stroke',
    metrics,
    cellW,
    rowH,
    pinyinH,
    charPx,
    cols,
    pages,
    strokeData,
  };
}

function breakParagraph(text: string, maxWidth: number, font: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, font) <= maxWidth || !current) {
      if (!current && measureText(candidate, font) > maxWidth) {
        // extremely long single word — hard break
        let part = '';
        for (const ch of word) {
          if (measureText(part + ch, font) > maxWidth && part) {
            lines.push(part);
            part = ch;
          } else {
            part += ch;
          }
        }
        current = part;
      } else {
        current = candidate;
      }
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildEnglishWordModel(settings: SheetSettings, content: string): FourLineModel {
  const metrics = metricsFor(settings);
  const nominal = Math.max(20, settings.gridSize);
  const cols = Math.max(1, Math.floor(metrics.contentW / nominal));
  const cellW = metrics.contentW / cols;
  const rowH = Math.round(cellW * 1.12);
  const pitch = rowH + settings.lineSpacing;
  const rowsPerPage = Math.max(1, Math.floor((metrics.contentH + settings.lineSpacing) / pitch));
  const charPx = cellW * (settings.fontSize / 100);
  const rows: FourLineRowModel[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [rawWord, ...rest] = trimmed.split('|');
    const word = rawWord.trim();
    const meaning = rest.join('|').trim();
    if (!word) continue;
    rows.push({
      text: word,
      repeatCount: 1,
      paragraph: false,
      empty: false,
      meaning: settings.englishWordShowMeaning ? meaning : '',
    });
    // 下方留一行空白四线格，供学生临写。
    rows.push({ text: '', repeatCount: 0, paragraph: false, empty: false });
  }

  const pages = paginate(rows, rowsPerPage, () => ({
    text: '',
    repeatCount: 0,
    paragraph: false,
    empty: true,
  })).map((pageRows) => ({ rows: pageRows }));

  return {
    kind: 'fourline',
    metrics,
    cellW,
    rowH,
    charPx,
    gap: cellW * 0.6,
    pages,
  };
}

function buildFourLineModel(
  type: SheetType,
  settings: SheetSettings,
  content: string,
): FourLineModel {
  if (type === 'englishWords') return buildEnglishWordModel(settings, content);

  const metrics = metricsFor(settings);
  const nominal = Math.max(20, settings.gridSize);
  const cols = Math.max(1, Math.floor(metrics.contentW / nominal));
  const cellW = metrics.contentW / cols;
  const rowH = Math.round(cellW * 1.12);
  const pitch = rowH + settings.lineSpacing;
  const rowsPerPage = Math.max(1, Math.floor((metrics.contentH + settings.lineSpacing) / pitch));
  const charPx = cellW * (settings.fontSize / 100);
  const gap = cellW * (type === 'pinyin' ? 0.35 : 0.6);
  const fontCss = `${settings.fontWeight} ${charPx}px ${fontStack(settings.fontId)}`;
  const paragraph = type === 'englishParagraph';
  const rawLines = content.split('\n').map((l) => l.trimEnd());
  const rows: FourLineRowModel[] = [];

  if (paragraph) {
    const lines = breakParagraph(content, metrics.contentW, fontCss);
    for (const line of lines) {
      rows.push({ text: line, repeatCount: 1, paragraph: true, empty: false });
    }
  } else {
    for (const line of rawLines) {
      if (!line.trim()) continue;
      const text = line.trim();
      const w = measureText(text, fontCss);
      const repeatCount = Math.max(
        1,
        Math.min(80, Math.floor((metrics.contentW + gap) / (w + gap))),
      );
      rows.push({ text, repeatCount, paragraph: false, empty: false });
    }
  }

  const pages = paginate(rows, rowsPerPage, () => ({
    text: '',
    repeatCount: 0,
    paragraph: false,
    empty: true,
  })).map((pageRows) => ({ rows: pageRows }));

  return {
    kind: 'fourline',
    metrics,
    cellW,
    rowH,
    charPx,
    gap,
    pages,
  };
}

function buildPenModel(settings: SheetSettings): PenModel {
  const metrics = metricsFor(settings);
  const cols = Math.max(1, Math.floor(metrics.contentW / Math.max(20, settings.gridSize)));
  const cellW = metrics.contentW / cols;
  const rowH = Math.round(cellW * 1.02);
  const pitch = rowH + settings.lineSpacing;
  const rowsPerPage = Math.max(1, Math.floor((metrics.contentH + settings.lineSpacing) / pitch));
  const rows: string[] = [];
  for (let i = 0; i < rowsPerPage; i += 1) {
    rows.push(PATTERNS[i % PATTERNS.length].id);
  }
  return { kind: 'pen', metrics, cellW, rowH, cols, rows };
}

function buildMathModel(
  type: Extract<SheetType, 'compare' | 'addSub' | 'mixed' | 'division' | 'multiplication'>,
  settings: SheetSettings,
  seed: number,
): MathModel {
  const metrics = metricsFor(settings);
  const fontPx = 33 * (settings.fontSize / 100);
  const rowHeight = fontPx * 2.55 + settings.lineSpacing;
  const cols = 3;
  const rowsPerPage = Math.max(1, Math.floor(metrics.contentH / rowHeight));
  const perPage = cols * rowsPerPage;
  const problems = generateMath(type, settings, seed);
  const pages = chunkPages(problems, perPage);
  return { kind: 'math', metrics, fontPx, rowHeight, cols, pages };
}

function buildVerticalModel(settings: SheetSettings, seed: number): VerticalModel {
  const metrics = metricsFor(settings);
  const digits = settings.verticalDigits === 3 ? 3 : 2;
  const heightFactor =
    settings.verticalOperation === 'div'
      ? 5.2
      : settings.verticalOperation === 'mul'
        ? 6.4
        : settings.verticalOperation === 'mixed'
          ? 7.2
          : 6;
  const fontPx = 30 * (settings.fontSize / 100);
  const blockHeight = fontPx * heightFactor + 20;
  const cols = digits === 3 ? 3 : 4;
  const rowsPerPage = Math.max(1, Math.floor(metrics.contentH / blockHeight));
  const perPage = cols * rowsPerPage;
  const problems = generateVertical(settings, seed);
  const pages = chunkPages(problems, perPage);
  return { kind: 'vertical', metrics, fontPx, blockHeight, cols, pages };
}

function buildPoemModel(settings: SheetSettings, content: string): PoemModel {
  const metrics = metricsFor(settings);
  const raw = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let title = '';
  let author = '';
  let notes: string[] = [];
  let lines: string[] = [];

  if (raw.length > 0) {
    const head = raw[0].split('|').map((part) => part.trim());
    if (head.length >= 2) {
      title = head[0] ?? '';
      author = [head[1], head[2]].filter(Boolean).join(' · ');
      lines = raw.slice(1);
    } else {
      title = raw[0];
      lines = raw.slice(1);
    }
  }
  lines = lines.filter((line) => {
    const match = line.match(/^(?:注|注释)[：:]\s*(.*)$/);
    if (!match) return true;
    if (match[1]) notes.push(match[1]);
    return false;
  });
  if (lines.length === 0) lines = [''];

  const vertical = settings.poemVertical;
  const showPinyin = settings.showPinyin && !vertical;
  const maxLine = Math.max(...lines.map((line) => Array.from(line).length), 1);

  const cellSize = vertical
    ? Math.max(
        22,
        Math.min(
          54,
          Math.floor(metrics.contentH / Math.max(maxLine, 1)),
          Math.floor((metrics.contentW - 24) / Math.max(lines.length, 1)),
        ),
      )
    : Math.max(
        24,
        Math.min(
          64,
          Math.floor(metrics.contentW / maxLine),
          Math.floor(metrics.contentH / Math.max(1, lines.length * 1.5)),
        ),
      );

  const pinyinH = showPinyin ? Math.round(cellSize * 0.34) : 0;
  return {
    kind: 'poem',
    metrics,
    vertical,
    showPinyin,
    showAuthor: settings.poemShowAuthor,
    title,
    author,
    lines,
    notes,
    showNotes: settings.poemShowNotes,
    cellSize,
    pinyinH,
    pinyinSize: Math.max(8, Math.round(cellSize * 0.26)),
  };
}

function buildExpressionModel(settings: SheetSettings, seed: number): ExpressionModel {
  const metrics = metricsFor(settings);
  const fontPx = 26 * (settings.fontSize / 100);
  const steps = settings.expressionSteps === 3 ? 3 : 2;
  const cols = 2;
  const blockHeight = fontPx * (2 + steps * 1.45) + 16;
  const rowsPerPage = Math.max(1, Math.floor(metrics.contentH / blockHeight));
  const problems = generateExpression(settings, seed);
  const pages = chunkPages(problems, cols * rowsPerPage);
  return {
    kind: 'expression',
    metrics,
    fontPx,
    cols,
    blockHeight,
    steps,
    pages,
  };
}

function buildAbacusModel(settings: SheetSettings, seed: number): AbacusModel {
  const metrics = metricsFor(settings);
  const mode = settings.abacusMode;
  const rods = settings.abacusRods;
  const problems = generateAbacus(settings, seed);

  if (mode === 'calc') {
    const fontPx = 24 * (settings.fontSize / 100);
    const cols =
      rods === 1 && settings.abacusTerms <= 3
        ? 2
        : rods === 2 && settings.abacusTerms <= 2
          ? 2
          : 1;
    const blockHeight = fontPx * 2.6 + 14;
    const rowsPerPage = Math.max(1, Math.floor(metrics.contentH / blockHeight));
    const pages = chunkPages(problems, cols * rowsPerPage);
    return {
      kind: 'abacus',
      metrics,
      mode,
      rods,
      cols,
      blockHeight,
      abacusWidth: 0,
      fontPx,
      pages,
    };
  }

  const cols = 3;
  const cellW = metrics.contentW / cols;
  const { width: viewWidth, height: viewHeight } = abacusViewBox(rods);
  const abacusWidth = Math.min(cellW * 0.88, rods * 36 + 30);
  const abacusHeight = abacusWidth * (viewHeight / viewWidth);
  const fontPx = 20 * (settings.fontSize / 100);
  const blockHeight = abacusHeight + 52;
  const rowsPerPage = Math.max(1, Math.floor(metrics.contentH / blockHeight));
  const pages = chunkPages(problems, cols * rowsPerPage);
  return {
    kind: 'abacus',
    metrics,
    mode,
    rods,
    cols,
    blockHeight,
    abacusWidth,
    fontPx,
    pages,
  };
}

function buildClockModel(settings: SheetSettings, seed: number): ClockModel {
  const metrics = metricsFor(settings);
  const cols = 5;
  const cellW = metrics.contentW / cols;
  const clockSize = Math.round(
    Math.min(cellW * 0.74, 120) * (settings.fontSize / 65),
  );
  const labelSize = Math.round(clockSize * 0.16);
  const rowHeight = clockSize + labelSize * 2 + 18;
  const rowsPerPage = Math.max(1, Math.floor(metrics.contentH / rowHeight));
  const perPage = cols * rowsPerPage;
  const problems = generateClocks(settings, seed);
  const pages = chunkPages(problems, perPage);
  return { kind: 'clock', metrics, cols, clockSize, labelSize, rowHeight, pages };
}

export function buildSheetModel(
  type: SheetType,
  settings: SheetSettings,
  content: string,
  seed: number,
  strokeData: Record<string, CharData> = {},
): SheetModel {
  const meta = SHEET_BY_ID[type];
  if (type === 'name' && settings.nameStrokeOrder) {
    const unique = uniqueHanChars(content);
    if (unique.length > 0 && unique.every((char) => Boolean(strokeData[char]))) {
      return buildNameStrokeModel(settings, content, strokeData);
    }
  }
  switch (meta.kind) {
    case 'grid':
    case 'gridFlow':
      return buildGridModel(type, settings, content);
    case 'fourline':
    case 'fourlineFlow':
      return buildFourLineModel(type, settings, content);
    case 'pen':
      return buildPenModel(settings);
    case 'math':
      return buildMathModel(
        type as Extract<SheetType, 'compare' | 'addSub' | 'mixed' | 'division' | 'multiplication'>,
        settings,
        seed,
      );
    case 'vertical':
      return buildVerticalModel(settings, seed);
    case 'expression':
      return buildExpressionModel(settings, seed);
    case 'poem':
      return buildPoemModel(settings, content);
    case 'abacus':
      return buildAbacusModel(settings, seed);
    case 'clock':
      return buildClockModel(settings, seed);
  }
}
