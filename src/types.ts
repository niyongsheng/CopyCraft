export type SheetType =
  | 'hanzi'
  | 'hanziWords'
  | 'hanziParagraph'
  | 'name'
  | 'pinyin'
  | 'stroke'
  | 'englishLetter'
  | 'englishParagraph'
  | 'penControl'
  | 'number'
  | 'compare'
  | 'addSub'
  | 'mixed'
  | 'division'
  | 'multiplication'
  | 'vertical'
  | 'expression'
  | 'abacus'
  | 'clock'
  | 'dictation'
  | 'englishWords'
  | 'blank'
  | 'poem';

export type ToolType = 'strokeQuery';

export type ThemeMode = 'light' | 'dark';

export type GridStyleId =
  | 'tian'
  | 'mi'
  | 'huigong'
  | 'jiugong'
  | 'tianhui'
  | 'fang'
  | 'fourline'
  | 'line';

export type SheetKind =
  | 'grid'
  | 'gridFlow'
  | 'fourline'
  | 'fourlineFlow'
  | 'pen'
  | 'math'
  | 'vertical'
  | 'expression'
  | 'abacus'
  | 'clock'
  | 'poem';

export interface SheetSettings {
  /* layout */
  lineSpacing: number;
  hMargin: number;
  vMargin: number;
  fontSize: number;
  /** Vertical offset of the glyph inside its cell, in px. */
  offset: number;
  /** Horizontal offset of the glyph inside its cell, in px. */
  offsetX: number;
  fontId: string;
  fontWeight: number;
  gridStyle: GridStyleId;
  gridSize: number;
  /* colors */
  borderColor: string;
  lineColor: string;
  traceColor: string;
  inkColor: string;
  showBorder: boolean;
  showPinyin: boolean;
  showText: boolean;
  showTitle: boolean;
  titleHeight: number;
  /* name sheet */
  nameStrokeOrder: boolean;
  nameNoRepeat: boolean;
  nameOneCharPerRow: boolean;
  /* math */
  mathOperation: 'add' | 'sub' | 'both';
  mathRange: number;
  mathMode: 'calc' | 'fill';
  count: number;
  /* vertical math */
  verticalOperation: 'add' | 'sub' | 'both' | 'mul' | 'div' | 'mixed';
  verticalDigits: 2 | 3;
  verticalCarry: 'any' | 'require' | 'avoid';
  verticalAllowRemainder: boolean;
  /* abacus */
  abacusMode: 'read' | 'draw' | 'calc';
  abacusRods: 1 | 2 | 3 | 4;
  abacusTerms: 2 | 3 | 4;
  /* expression */
  expressionOperation: 'addSub' | 'mulDiv' | 'mixed';
  expressionSteps: 2 | 3;
  expressionParentheses: boolean;
  /* english words */
  englishWordShowMeaning: boolean;
  /* poem */
  poemVertical: boolean;
  poemShowAuthor: boolean;
  poemShowNotes: boolean;
  /* clock */
  clockMode: 'read' | 'draw';
  clockFace: 'arabic' | 'roman' | 'none';
  clockMinute: 'any' | '5' | '15';
  clock24h: boolean;
  clockShowTime: boolean;
}

export type TextSheetType =
  | 'hanzi'
  | 'hanziWords'
  | 'hanziParagraph'
  | 'name'
  | 'pinyin'
  | 'dictation'
  | 'englishWords'
  | 'poem'
  | 'stroke'
  | 'englishLetter'
  | 'englishParagraph'
  | 'number';

export type SheetGroup = '常用' | '英文' | '数学' | '工具';

export interface SheetMeta {
  id: SheetType;
  label: string;
  group: SheetGroup;
  kind: SheetKind;
  defaultTitle: string;
  showGridOptions: boolean;
  showPinyinOption: boolean;
  showTextOption: boolean;
}

export interface ToolMeta {
  id: ToolType;
  label: string;
  group: SheetGroup;
}

export interface Problem {
  id: number;
  expression: string;
  answer: number;
}

export interface VerticalProblem {
  id: number;
  a: number;
  b: number;
  op: '+' | '−' | '×' | '÷';
  answer: number;
  /** divisor for long division */
  quotient?: number;
  remainder?: number;
}

export interface ClockProblem {
  id: number;
  hour: number;
  minute: number;
}
