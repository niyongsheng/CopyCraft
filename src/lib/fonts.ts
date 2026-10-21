export interface FontDef {
  id: string;
  label: string;
  group: '中文' | '英文';
  stack: string;
}

const cn = (name: string, fallback = 'Kaiti SC') =>
  `"${name}", "${fallback}", "STKaiti", "KaiTi", "Songti SC", serif`;

export const FONTS: FontDef[] = [
  { id: 'kaiti', label: '楷体', group: '中文', stack: cn('Kaiti SC') },
  { id: 'xingkai', label: '行楷', group: '中文', stack: cn('Xingkai SC') },
  { id: 'hanzipen', label: '手札体', group: '中文', stack: cn('HanziPen SC') },
  { id: 'hannotate', label: '翩翩体', group: '中文', stack: cn('Hannotate SC') },
  { id: 'weibei', label: '魏碑', group: '中文', stack: cn('Weibei SC') },
  { id: 'libian', label: '隶变', group: '中文', stack: cn('Libian SC') },
  { id: 'yuanti', label: '圆体', group: '中文', stack: cn('Yuanti SC') },
  { id: 'songti', label: '宋体', group: '中文', stack: cn('Songti SC') },
  {
    id: 'pingfang',
    label: '黑体',
    group: '中文',
    stack: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  { id: 'wawati', label: '娃娃体', group: '中文', stack: cn('Wawati SC') },
  {
    id: 'bradley',
    label: '手写体',
    group: '英文',
    stack: '"Bradley Hand", "Snell Roundhand", "Segoe Print", cursive',
  },
  {
    id: 'noteworthy',
    label: '笔记体',
    group: '英文',
    stack: '"Noteworthy", "Comic Sans MS", "Chalkboard SE", cursive',
  },
  {
    id: 'marker',
    label: '马克笔',
    group: '英文',
    stack: '"Marker Felt", "Chalkboard SE", cursive',
  },
  {
    id: 'chancery',
    label: '花体',
    group: '英文',
    stack: '"Apple Chancery", "Snell Roundhand", cursive',
  },
];

export function fontStack(id: string): string {
  return FONTS.find((f) => f.id === id)?.stack ?? FONTS[0].stack;
}

export const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
];
