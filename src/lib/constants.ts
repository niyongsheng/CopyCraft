import type {
  GridStyleId,
  SheetMeta,
  SheetSettings,
  SheetType,
  TextSheetType,
  ToolMeta,
  ToolType,
} from '../types';

/** A4 at 96dpi — the preview is rendered at this pixel size. */
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

export const GRID_STYLES: { id: GridStyleId; label: string }[] = [
  { id: 'tian', label: '田字格' },
  { id: 'mi', label: '米字格' },
  { id: 'huigong', label: '回宫格' },
  { id: 'jiugong', label: '九宫格' },
  { id: 'tianhui', label: '田回格' },
  { id: 'fang', label: '方格' },
  { id: 'fourline', label: '四线三格' },
  { id: 'line', label: '横线格' },
];

export const SHEETS: SheetMeta[] = [
  {
    id: 'name',
    label: '姓名字帖',
    group: '常用',
    kind: 'grid',
    defaultTitle: '姓名字帖',
    showGridOptions: true,
    showPinyinOption: true,
    showTextOption: false,
  },
  {
    id: 'hanzi',
    label: '汉字字帖',
    group: '常用',
    kind: 'grid',
    defaultTitle: '天天练字',
    showGridOptions: true,
    showPinyinOption: true,
    showTextOption: false,
  },
  {
    id: 'hanziWords',
    label: '生字组词帖',
    group: '常用',
    kind: 'grid',
    defaultTitle: '生字组词',
    showGridOptions: true,
    showPinyinOption: true,
    showTextOption: false,
  },
  {
    id: 'dictation',
    label: '看拼音写词语',
    group: '常用',
    kind: 'grid',
    defaultTitle: '看拼音写词语',
    showGridOptions: true,
    showPinyinOption: true,
    showTextOption: false,
  },
  {
    id: 'hanziParagraph',
    label: '汉字段落字帖',
    group: '常用',
    kind: 'gridFlow',
    defaultTitle: '段落练习',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'poem',
    label: '古诗词字帖',
    group: '常用',
    kind: 'poem',
    defaultTitle: '古诗词字帖',
    showGridOptions: true,
    showPinyinOption: true,
    showTextOption: false,
  },
  {
    id: 'pinyin',
    label: '拼音字母字帖',
    group: '常用',
    kind: 'fourline',
    defaultTitle: '拼音字母字帖',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'stroke',
    label: '汉字笔画描写帖',
    group: '常用',
    kind: 'grid',
    defaultTitle: '笔画描写',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'penControl',
    label: '控笔练习字帖',
    group: '常用',
    kind: 'pen',
    defaultTitle: '控笔练习',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'number',
    label: '数字字帖',
    group: '常用',
    kind: 'grid',
    defaultTitle: '数字字帖',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'englishLetter',
    label: '英文字母字帖',
    group: '英文',
    kind: 'fourline',
    defaultTitle: 'Handwriting Practice',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: true,
  },
  {
    id: 'englishWords',
    label: '英语单词帖',
    group: '英文',
    kind: 'fourline',
    defaultTitle: '英语单词练习',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: true,
  },
  {
    id: 'englishParagraph',
    label: '英文段落字帖',
    group: '英文',
    kind: 'fourlineFlow',
    defaultTitle: 'Handwriting Practice',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'compare',
    label: '数字比大小',
    group: '数学',
    kind: 'math',
    defaultTitle: '数字比大小',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'addSub',
    label: '加减法运算字帖',
    group: '数学',
    kind: 'math',
    defaultTitle: '加减法运算字帖',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'mixed',
    label: '加减混合运算字帖',
    group: '数学',
    kind: 'math',
    defaultTitle: '加减混合运算字帖',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'division',
    label: '除法字帖',
    group: '数学',
    kind: 'math',
    defaultTitle: '除法字帖',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'multiplication',
    label: '乘法字帖',
    group: '数学',
    kind: 'math',
    defaultTitle: '乘法字帖',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'vertical',
    label: '竖式计算字帖',
    group: '数学',
    kind: 'vertical',
    defaultTitle: '竖式计算字帖',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'expression',
    label: '脱式计算字帖',
    group: '数学',
    kind: 'expression',
    defaultTitle: '脱式计算',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'abacus',
    label: '珠心算字帖',
    group: '数学',
    kind: 'abacus',
    defaultTitle: '珠心算练习',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'blank',
    label: '空白练习纸',
    group: '工具',
    kind: 'grid',
    defaultTitle: '空白练习纸',
    showGridOptions: true,
    showPinyinOption: false,
    showTextOption: false,
  },
  {
    id: 'clock',
    label: '学习时钟字帖',
    group: '工具',
    kind: 'clock',
    defaultTitle: '学习时钟',
    showGridOptions: false,
    showPinyinOption: false,
    showTextOption: false,
  },
];

export const SHEET_BY_ID: Record<SheetType, SheetMeta> = Object.fromEntries(
  SHEETS.map((s) => [s.id, s]),
) as Record<SheetType, SheetMeta>;

/** Interactive tools that live beside the sheet types but have no model or export. */
export const TOOLS: ToolMeta[] = [
  { id: 'strokeQuery', label: '笔顺查询', group: '工具' },
];

export const TOOL_BY_ID: Record<ToolType, ToolMeta> = Object.fromEntries(
  TOOLS.map((tool) => [tool.id, tool]),
) as Record<ToolType, ToolMeta>;

export const DEFAULT_CONTENT: Record<TextSheetType, string> = {
  hanzi: '你好世界\n好\n世\n界',
  hanziWords: '牵 牵挂 牵头\n逊 逊色 谦逊\n疏 稀疏 疏远\n春 春天 春风\n花 花朵 花草\n草 草地 小草',
  hanziParagraph:
    '春天来了，小草悄悄地从土里探出头来。柳树抽出嫩绿的枝条，在微风中轻轻摇摆。孩子们脱下厚厚的棉衣，跑到田野里放风筝。蓝天白云下，到处都是欢声笑语，春天真美啊！',
  name: '倪希米\n希米',
  dictation: '春天\n花朵\n学校\n朋友\n老师\n同学\n语文\n数学',
  englishWords: 'apple|苹果\nbanana|香蕉\norange|橙子\nwater|水\nbook|书\npencil|铅笔\nschool|学校\nteacher|老师',
  poem: '静夜思|李白|唐\n床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。\n注：疑，好像。',
  pinyin: 'āo\ná\nǎ\nà\na o e i u ü\nb p m f\nd t n l\ng k h j q x\nzh ch sh r\nz c s y w',
  stroke:
    '㇐\n㇑\n㇓\n㇔\n㇕\n㇖\n㇗\n㇘\n㇙\n㇚\n㇛\n㇜\n㇝\n㇞\n㇟\n㇠\n㇡\n㇢\n㇣',
  englishLetter: 'Aa\nBb\nHello\nD\nE\nF\nG\nH',
  englishParagraph:
    'Reading opens a window to the world. Every page invites us to explore new ideas, meet interesting people, and travel to places we have never seen. With a pencil in hand, we can slow down, practice each letter, and enjoy the quiet pleasure of writing.',
  number: '0\n1\n2\n3\n4\n5\n6\n7\n8\n9',
};

/** Text-editing key for a sheet type, when it has editable content. */
export function textKeyFor(type: SheetType): TextSheetType | undefined {
  return type in DEFAULT_CONTENT ? (type as TextSheetType) : undefined;
}

/** Sheets whose content is generated from settings rather than typed by the user. */
export function isGeneratedSheet(meta: SheetMeta): boolean {
  return (
    meta.kind === 'math' ||
    meta.kind === 'vertical' ||
    meta.kind === 'expression' ||
    meta.kind === 'abacus' ||
    meta.kind === 'clock'
  );
}

const baseSettings: SheetSettings = {
  lineSpacing: 4,
  hMargin: 30,
  vMargin: 30,
  fontSize: 78,
  offset: 0,
  offsetX: 0,
  fontId: 'kaiti',
  fontWeight: 400,
  gridStyle: 'tian',
  gridSize: 32,
  borderColor: '#e5484d',
  lineColor: '#f0a5a8',
  traceColor: '#c9c9c9',
  inkColor: '#2b2b2e',
  showBorder: true,
  showPinyin: true,
  showText: true,
  showTitle: true,
  titleHeight: 65,
  nameStrokeOrder: true,
  nameNoRepeat: false,
  nameOneCharPerRow: false,
  mathOperation: 'add',
  mathRange: 20,
  mathMode: 'calc',
  count: 48,
  verticalOperation: 'add',
  verticalDigits: 2,
  verticalCarry: 'any',
  verticalAllowRemainder: true,
  abacusMode: 'read',
  abacusRods: 2,
  abacusTerms: 3,
  expressionOperation: 'addSub',
  expressionSteps: 2,
  expressionParentheses: false,
  englishWordShowMeaning: true,
  poemVertical: false,
  poemShowAuthor: true,
  poemShowNotes: true,
  clockMode: 'read',
  clockFace: 'arabic',
  clockMinute: 'any',
  clock24h: false,
  clockShowTime: true,
};

const overrides: Partial<Record<SheetType, Partial<SheetSettings>>> = {
  hanzi: { gridSize: 34, titleHeight: 70 },
  hanziWords: { gridSize: 44, fontSize: 72, titleHeight: 70, showPinyin: true },
  hanziParagraph: { gridSize: 32, showPinyin: false, fontSize: 68 },
  name: {
    gridSize: 40,
    titleHeight: 70,
    nameStrokeOrder: true,
    nameNoRepeat: false,
    nameOneCharPerRow: false,
  },
  pinyin: { gridStyle: 'fourline', gridSize: 38, fontId: 'kaiti', fontSize: 70 },
  stroke: { gridSize: 42, fontSize: 92 },
  englishLetter: { gridStyle: 'fourline', gridSize: 40, fontId: 'bradley', fontSize: 68 },
  englishParagraph: { gridStyle: 'fourline', gridSize: 38, fontId: 'bradley', fontSize: 62 },
  penControl: { gridSize: 42, lineSpacing: 2, gridStyle: 'fang' },
  number: { gridSize: 40, fontSize: 74 },
  compare: {
    count: 45,
    mathRange: 20,
    fontSize: 65,
    showBorder: false,
    traceColor: '#2b2b2e',
  },
  addSub: { count: 48, mathRange: 20, fontSize: 65, showBorder: false, traceColor: '#2b2b2e' },
  mixed: { count: 36, mathRange: 20, fontSize: 65, showBorder: false, traceColor: '#2b2b2e' },
  division: { count: 48, fontSize: 65, showBorder: false, traceColor: '#2b2b2e' },
  multiplication: {
    count: 45,
    mathRange: 9,
    fontSize: 65,
    showBorder: false,
    traceColor: '#2b2b2e',
  },
  vertical: {
    count: 24,
    fontSize: 65,
    showBorder: false,
    traceColor: '#2b2b2e',
    verticalOperation: 'add',
    verticalDigits: 2,
    verticalCarry: 'any',
    verticalAllowRemainder: true,
  },
  dictation: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  poem: { gridSize: 52, fontSize: 78, showPinyin: true, titleHeight: 70 },
  englishWords: {
    gridStyle: 'fourline',
    gridSize: 40,
    fontId: 'bradley',
    fontSize: 68,
    showText: true,
    titleHeight: 70,
  },
  expression: {
    count: 24,
    fontSize: 65,
    showBorder: false,
    traceColor: '#2b2b2e',
    expressionOperation: 'addSub',
    expressionSteps: 2,
    expressionParentheses: false,
  },
  blank: { gridStyle: 'fang', gridSize: 44, showPinyin: false, showBorder: true, titleHeight: 70 },
  clock: { count: 30, fontSize: 65, gridSize: 40, showBorder: false, traceColor: '#2b2b2e' },
  abacus: {
    count: 12,
    fontSize: 65,
    showBorder: false,
    traceColor: '#c9c9c9',
    abacusMode: 'read',
    abacusRods: 2,
    abacusTerms: 3,
  },
};

export function defaultSettingsFor(type: SheetType): SheetSettings {
  return { ...baseSettings, ...overrides[type] };
}

export function defaultTitleFor(type: SheetType): string {
  return SHEET_BY_ID[type].defaultTitle;
}
