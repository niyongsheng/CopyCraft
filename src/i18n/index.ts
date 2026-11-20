import type { GridStyleId, SheetGroup, SheetType, ToolType } from '../types';
import en from './en';
import ja from './ja';
import ko from './ko';
import zhCN, { type I18nKey } from './zh-CN';
import zhTW from './zh-TW';

export type { I18nKey };
export type Language = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';
export type Vars = Record<string, string | number>;

/** Native language names, shown in the settings picker. */
export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'zh-CN', label: '简体中文' },
  { id: 'zh-TW', label: '繁體中文' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
];

const DICTS: Record<Language, Record<I18nKey, string>> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en,
  ja,
  ko,
};

function fill(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

export function translate(language: Language, key: I18nKey, vars?: Vars): string {
  const template = DICTS[language]?.[key] ?? zhCN[key] ?? key;
  if (!vars) return template;
  // Count strings use "singular|plural" so English reads naturally.
  const [one, other] =
    typeof vars.count === 'number' && template.includes('|')
      ? template.split('|')
      : [template, template];
  return fill(vars.count === 1 ? one : other, vars);
}

/**
 * Language used by non-React modules (export filenames, document metadata).
 * Kept in sync with the store by `App`.
 */
let activeLanguage: Language = 'zh-CN';

export function setActiveLanguage(language: Language): void {
  activeLanguage = language;
}

export function getActiveLanguage(): Language {
  return activeLanguage;
}

export function tGlobal(key: I18nKey, vars?: Vars): string {
  return translate(activeLanguage, key, vars);
}

/** Pick a supported language from the browser's preference list. */
export function detectLanguage(): Language {
  const list =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  for (const raw of list) {
    const tag = String(raw).toLowerCase();
    if (tag.startsWith('zh')) {
      return tag.includes('tw') ||
        tag.includes('hk') ||
        tag.includes('mo') ||
        tag.includes('hant')
        ? 'zh-TW'
        : 'zh-CN';
    }
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('en')) return 'en';
  }
  return 'zh-CN';
}

/** Sheet ids use stable translation keys instead of the Chinese labels in SHEETS. */
export const SHEET_LABEL_KEYS: Record<SheetType, I18nKey> = {
  name: 'sheet.name',
  hanzi: 'sheet.hanzi',
  hanziWords: 'sheet.hanziWords',
  dictation: 'sheet.dictation',
  hanziParagraph: 'sheet.hanziParagraph',
  poem: 'sheet.poem',
  pinyin: 'sheet.pinyin',
  stroke: 'sheet.stroke',
  penControl: 'sheet.penControl',
  number: 'sheet.number',
  englishLetter: 'sheet.englishLetter',
  englishWords: 'sheet.englishWords',
  englishParagraph: 'sheet.englishParagraph',
  compare: 'sheet.compare',
  addSub: 'sheet.addSub',
  mixed: 'sheet.mixed',
  division: 'sheet.division',
  multiplication: 'sheet.multiplication',
  vertical: 'sheet.vertical',
  expression: 'sheet.expression',
  abacus: 'sheet.abacus',
  blank: 'sheet.blank',
  clock: 'sheet.clock',
};

export const TOOL_LABEL_KEYS: Record<ToolType, I18nKey> = {
  strokeQuery: 'tool.strokeQuery',
};

export const GROUP_LABEL_KEYS: Record<SheetGroup, I18nKey> = {
  常用: 'sidebar.groupCommon',
  英文: 'sidebar.groupEnglish',
  数学: 'sidebar.groupMath',
  工具: 'sidebar.groupTools',
};

export const GRADE_LABEL_KEYS: Record<string, I18nKey> = {
  一年级: 'grade.1',
  二年级: 'grade.2',
  三年级: 'grade.3',
  四年级: 'grade.4',
  五年级: 'grade.5',
  六年级: 'grade.6',
};

export const GRID_STYLE_KEYS: Record<GridStyleId, I18nKey> = {
  tian: 'grid.tian',
  mi: 'grid.mi',
  huigong: 'grid.huigong',
  jiugong: 'grid.jiugong',
  tianhui: 'grid.tianhui',
  fang: 'grid.fang',
  fourline: 'grid.fourline',
  line: 'grid.line',
};

export const FONT_LABEL_KEYS: Record<string, I18nKey> = {
  kaiti: 'font.kaiti',
  xingkai: 'font.xingkai',
  hanzipen: 'font.hanzipen',
  hannotate: 'font.hannotate',
  weibei: 'font.weibei',
  libian: 'font.libian',
  yuanti: 'font.yuanti',
  songti: 'font.songti',
  pingfang: 'font.pingfang',
  wawati: 'font.wawati',
  bradley: 'font.bradley',
  noteworthy: 'font.noteworthy',
  marker: 'font.marker',
  chancery: 'font.chancery',
};

export const FONT_GROUP_KEYS: Record<'中文' | '英文', I18nKey> = {
  中文: 'fontGroup.cn',
  英文: 'fontGroup.en',
};

export const WEIGHT_LABEL_KEYS: Record<number, I18nKey> = {
  300: 'weight.light',
  400: 'weight.regular',
  500: 'weight.medium',
  600: 'weight.semibold',
  700: 'weight.bold',
};
