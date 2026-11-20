import type { I18nKey } from '../i18n';
import type { SheetSettings, SheetType } from '../types';
import { GRADE_PRESETS, GRADE_WORKBOOK_PRESETS } from './gradePresets';

export const GRADE_ORDER = [
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
];

export type PresetCategory =
  | 'textbook'
  | 'structure'
  | 'radical'
  | 'words'
  | 'poem'
  | 'workbook';

export type Semester = '上册' | '下册';

export interface SheetPreset {
  id: string;
  category: Exclude<PresetCategory, 'workbook'>;
  title: string;
  description: string;
  badge?: string;
  tags: string[];
  /** 课本同步/组词模板按年级筛选；主题模板可省略。 */
  grade?: string;
  semester?: Semester;
  type: SheetType;
  pageTitle: string;
  content: string;
  settings?: Partial<SheetSettings>;
}

export interface WorkbookSection {
  type: SheetType;
  title: string;
  content: string;
  settings?: Partial<SheetSettings>;
}

export interface WorkbookPreset {
  id: string;
  category: 'workbook';
  title: string;
  description: string;
  badge?: string;
  tags: string[];
  grade?: string;
  semester?: Semester;
  sections: WorkbookSection[];
}

export type Preset = SheetPreset | WorkbookPreset;

export const PRESET_CATEGORIES: {
  id: PresetCategory;
  labelKey: I18nKey;
  hintKey: I18nKey;
}[] = [
  { id: 'textbook', labelKey: 'category.textbook.label', hintKey: 'category.textbook.hint' },
  { id: 'structure', labelKey: 'category.structure.label', hintKey: 'category.structure.hint' },
  { id: 'radical', labelKey: 'category.radical.label', hintKey: 'category.radical.hint' },
  { id: 'words', labelKey: 'category.words.label', hintKey: 'category.words.hint' },
  { id: 'poem', labelKey: 'category.poem.label', hintKey: 'category.poem.hint' },
  { id: 'workbook', labelKey: 'category.workbook.label', hintKey: 'category.workbook.hint' },
];

const chars = (...items: string[]) => items.join('\n');
const words = (...items: string[]) => items.join('\n');

const TEXTBOOK_G4_U1 = chars(
  '据',
  '随',
  '堤',
  '顿',
  '墙',
  '崩',
  '霎',
  '余',
  '耀',
  '肢',
  '整',
  '填',
);

const TEXTBOOK_G1_BASIC = chars(
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '人',
  '口',
  '手',
  '足',
  '日',
  '月',
);

const STRUCTURE_LEFT_RIGHT = chars(
  '明',
  '好',
  '林',
  '朋',
  '们',
  '你',
  '他',
  '地',
  '妈',
  '姐',
  '江',
  '河',
  '树',
  '枝',
  '桥',
  '湖',
);

const STRUCTURE_TOP_BOTTOM = chars(
  '字',
  '春',
  '花',
  '草',
  '星',
  '思',
  '想',
  '家',
  '笑',
  '云',
  '雪',
  '雷',
  '苗',
  '茶',
  '苦',
  '莲',
);

const STRUCTURE_ENCLOSURE = chars(
  '国',
  '园',
  '回',
  '因',
  '图',
  '圆',
  '团',
  '围',
  '固',
  '困',
  '圈',
);

const STRUCTURE_SEMI = chars(
  '远',
  '近',
  '边',
  '过',
  '还',
  '这',
  '连',
  '送',
  '选',
  '追',
  '问',
  '间',
  '同',
  '风',
  '庆',
);

const STRUCTURE_SINGLE = chars(
  '人',
  '口',
  '日',
  '月',
  '山',
  '水',
  '火',
  '木',
  '禾',
  '田',
  '上',
  '下',
  '大',
  '小',
  '天',
);

const RADICAL_WATER = chars(
  '江',
  '河',
  '海',
  '洋',
  '清',
  '深',
  '浅',
  '流',
  '湖',
  '溪',
  '池',
  '湿',
);

const RADICAL_WOOD = chars(
  '林',
  '森',
  '树',
  '枝',
  '根',
  '桃',
  '柳',
  '松',
  '柏',
  '桥',
  '桌',
  '椅',
);

const RADICAL_HAND = chars(
  '打',
  '提',
  '拍',
  '拉',
  '推',
  '搭',
  '扫',
  '拾',
  '挂',
  '指',
  '抱',
  '捉',
);

const RADICAL_PERSON = chars(
  '你',
  '他',
  '们',
  '休',
  '住',
  '位',
  '作',
  '体',
  '何',
  '伴',
  '倒',
  '借',
);

const RADICAL_SPEECH = chars(
  '说',
  '话',
  '语',
  '词',
  '诗',
  '读',
  '请',
  '谁',
  '谢',
  '认',
  '讲',
  '训',
);

const RADICAL_GRASS = chars(
  '花',
  '草',
  '苗',
  '茶',
  '菜',
  '苦',
  '莲',
  '荷',
  '芽',
  '蓝',
  '落',
  '蒙',
);

const RADICAL_ROOF = chars(
  '家',
  '字',
  '安',
  '定',
  '宝',
  '室',
  '客',
  '害',
  '宽',
  '宿',
  '密',
  '寒',
);

const RADICAL_WOMAN = chars(
  '妈',
  '姐',
  '妹',
  '奶',
  '好',
  '姓',
  '她',
  '如',
  '姑',
  '娘',
  '妙',
  '委',
);

const RADICAL_MOUTH = chars(
  '吃',
  '叫',
  '吗',
  '听',
  '唱',
  '叶',
  '员',
  '和',
  '呢',
  '吧',
  '味',
  '哈',
);

const RADICAL_HEART = chars(
  '情',
  '快',
  '怕',
  '慢',
  '忙',
  '恨',
  '懂',
  '怀',
  '悄',
  '悔',
  '惯',
  '慌',
);

const PARAGRAPH_SPRING =
  '春天来了，小草悄悄地从土里探出头来。柳树抽出嫩绿的枝条，在微风中轻轻摇摆。孩子们脱下厚厚的棉衣，跑到田野里放风筝。蓝天白云下，到处都是欢声笑语，春天真美啊！';

export const SHEET_PRESETS: SheetPreset[] = [
  /* ── 课本同步 ───────────────────────────────────────────── */
  {
    id: 'tb-g4a-u1-basic',
    category: 'textbook',
    grade: '四年级',
    semester: '上册',
    title: '四年级上册 · 生字起步',
    description: '合体字起步组：据、随、堤、顿等，适合单元同步描红。',
    badge: '四年级上 · 示例',
    tags: ['四年级', '上册', '生字', '合体字'],
    type: 'hanzi',
    pageTitle: '四年级上册 · 生字描红',
    content: TEXTBOOK_G4_U1,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'tb-g4a-u1-advanced',
    category: 'textbook',
    grade: '四年级',
    semester: '上册',
    title: '四年级上册 · 进阶结构字',
    description: '墙、崩、霎、余等结构更复杂的字，承接第一组。',
    badge: '四年级上 · 示例',
    tags: ['四年级', '上册', '结构', '进阶'],
    type: 'hanzi',
    pageTitle: '四年级上册 · 进阶结构字',
    content: chars('墙', '崩', '霎', '余', '耀', '肢', '整', '填'),
    settings: { gridSize: 42, fontSize: 76, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'tb-g1a-basic',
    category: 'textbook',
    grade: '一年级',
    semester: '上册',
    title: '一年级上册 · 常用字起步',
    description: '数字与身体、自然基础字，适合刚握笔的小朋友。',
    badge: '一年级上 · 示例',
    tags: ['一年级', '上册', '基础字', '数字'],
    type: 'hanzi',
    pageTitle: '一年级上册 · 常用字起步',
    content: TEXTBOOK_G1_BASIC,
    settings: { gridSize: 46, fontSize: 82, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'tb-g4a-u1-words',
    category: 'textbook',
    grade: '四年级',
    semester: '上册',
    title: '四年级上册 · 生字组词',
    description: '把生字和常用词语绑在一起练，顺手巩固字词默写。',
    badge: '四年级上 · 示例',
    tags: ['四年级', '上册', '组词', '词语'],
    type: 'hanziWords',
    pageTitle: '四年级上册 · 生字组词',
    content: words(
      '牵 牵挂 牵头',
      '逊 逊色 谦逊',
      '疏 稀疏 疏远',
      '潮 潮水 观潮',
      '堤 堤坝 河堤',
      '霎 霎时 霎那',
      '余 余下 剩余',
      '耀 耀眼 闪耀',
    ),
    settings: { gridSize: 44, fontSize: 72, showPinyin: true, titleHeight: 70 },
  },

  /* ── 结构规律 ───────────────────────────────────────────── */
  {
    id: 'st-left-right',
    category: 'structure',
    title: '左右结构 · 左窄右宽',
    description: '左右结构常用规则：左窄右宽、左高右低、穿插避让。',
    badge: '结构规律',
    tags: ['左右结构', '偏旁', '结构'],
    type: 'hanzi',
    pageTitle: '左右结构：左窄右宽，穿插避让',
    content: STRUCTURE_LEFT_RIGHT,
    settings: { gridSize: 42, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'st-top-bottom',
    category: 'structure',
    title: '上下结构 · 上紧下松',
    description: '上下结构要把重心对齐，上部收紧、下部舒展。',
    badge: '结构规律',
    tags: ['上下结构', '重心', '结构'],
    type: 'hanzi',
    pageTitle: '上下结构：上紧下松，重心对齐',
    content: STRUCTURE_TOP_BOTTOM,
    settings: { gridSize: 42, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'st-enclosure',
    category: 'structure',
    title: '全包围结构 · 框大内收',
    description: '外框写大，内部收紧居中，留出均匀的呼吸空间。',
    badge: '结构规律',
    tags: ['包围结构', '外框', '结构'],
    type: 'hanzi',
    pageTitle: '全包围结构：框大内收，内部居中',
    content: STRUCTURE_ENCLOSURE,
    settings: { gridSize: 44, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'st-semi',
    category: 'structure',
    title: '半包围结构 · 内部靠拢',
    description: '走之、门字框等半包围结构，内部要靠拢，主笔舒展。',
    badge: '结构规律',
    tags: ['半包围结构', '走之', '结构'],
    type: 'hanzi',
    pageTitle: '半包围结构：内部靠拢，主笔舒展',
    content: STRUCTURE_SEMI,
    settings: { gridSize: 42, fontSize: 76, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'st-single',
    category: 'structure',
    title: '独体字 · 主笔突出',
    description: '独体字没有偏旁可依，重点练主笔和整体重心。',
    badge: '结构规律',
    tags: ['独体字', '主笔', '结构'],
    type: 'hanzi',
    pageTitle: '独体字：主笔突出，重心平稳',
    content: STRUCTURE_SINGLE,
    settings: { gridSize: 44, fontSize: 80, showPinyin: true, titleHeight: 70 },
  },

  /* ── 偏旁部首 ───────────────────────────────────────────── */
  {
    id: 'rd-water',
    category: 'radical',
    title: '三点水（氵）',
    description: '同偏旁集中练：氵在左要写得窄，右边主体舒展。',
    badge: '偏旁部首',
    tags: ['氵', '三点水', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 三点水（氵）',
    content: RADICAL_WATER,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-wood',
    category: 'radical',
    title: '木字旁（木）',
    description: '木字旁收紧变窄，末笔捺变点，给右边让位置。',
    badge: '偏旁部首',
    tags: ['木', '木字旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 木字旁（木）',
    content: RADICAL_WOOD,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-hand',
    category: 'radical',
    title: '提手旁（扌）',
    description: '提手旁横短竖长、提画有力，右边部件对准竖线。',
    badge: '偏旁部首',
    tags: ['扌', '提手旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 提手旁（扌）',
    content: RADICAL_HAND,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-person',
    category: 'radical',
    title: '单人旁（亻）',
    description: '单人旁撇短竖长，右边部件高低错落。',
    badge: '偏旁部首',
    tags: ['亻', '单人旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 单人旁（亻）',
    content: RADICAL_PERSON,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-speech',
    category: 'radical',
    title: '言字旁（讠）',
    description: '言字旁点横分离、竖提干脆，右边保持舒展。',
    badge: '偏旁部首',
    tags: ['讠', '言字旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 言字旁（讠）',
    content: RADICAL_SPEECH,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-grass',
    category: 'radical',
    title: '草字头（艹）',
    description: '草字头横长两竖短，覆盖下部主体。',
    badge: '偏旁部首',
    tags: ['艹', '草字头', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 草字头（艹）',
    content: RADICAL_GRASS,
    settings: { gridSize: 42, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-roof',
    category: 'radical',
    title: '宝盖头（宀）',
    description: '宝盖头点居中、横钩舒展，像一把伞盖住下部。',
    badge: '偏旁部首',
    tags: ['宀', '宝盖头', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 宝盖头（宀）',
    content: RADICAL_ROOF,
    settings: { gridSize: 42, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-woman',
    category: 'radical',
    title: '女字旁（女）',
    description: '女字旁撇点收紧、提画向右，左右部件互相避让。',
    badge: '偏旁部首',
    tags: ['女', '女字旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 女字旁（女）',
    content: RADICAL_WOMAN,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-mouth',
    category: 'radical',
    title: '口字旁（口）',
    description: '口字旁写小、位置偏上，给右边留出空间。',
    badge: '偏旁部首',
    tags: ['口', '口字旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 口字旁（口）',
    content: RADICAL_MOUTH,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'rd-heart',
    category: 'radical',
    title: '竖心旁（忄）',
    description: '竖心旁左点低右点高，竖画挺直，右部重心对齐。',
    badge: '偏旁部首',
    tags: ['忄', '竖心旁', '偏旁'],
    type: 'hanzi',
    pageTitle: '偏旁部首 · 竖心旁（忄）',
    content: RADICAL_HEART,
    settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
  },

  /* ── 生字组词 ───────────────────────────────────────────── */
  {
    id: 'wd-g4a-u1',
    category: 'words',
    grade: '四年级',
    semester: '上册',
    title: '四年级上册 · 生字组词',
    description: '每个生字配两个常用词，练字和词语积累一起完成。',
    badge: '生字组词',
    tags: ['四年级', '组词', '词语'],
    type: 'hanziWords',
    pageTitle: '生字组词 · 四年级上册',
    content: words(
      '牵 牵挂 牵头',
      '逊 逊色 谦逊',
      '疏 稀疏 疏远',
      '潮 潮水 观潮',
      '堤 堤坝 河堤',
      '霎 霎时 霎那',
      '余 余下 剩余',
      '耀 耀眼 闪耀',
    ),
    settings: { gridSize: 44, fontSize: 72, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'wd-nature',
    category: 'words',
    title: '自然主题 · 生字组词',
    description: '春天、花草、山水、雨雪，一组自然主题词语。',
    badge: '生字组词',
    tags: ['自然', '春天', '组词'],
    type: 'hanziWords',
    pageTitle: '生字组词 · 自然',
    content: words(
      '春 春天 春风',
      '花 花朵 花草',
      '草 草地 小草',
      '山 高山 山水',
      '水 河水 流水',
      '云 白云 云朵',
      '雨 下雨 雨水',
      '雪 雪花 白雪',
    ),
    settings: { gridSize: 44, fontSize: 72, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'wd-home',
    category: 'words',
    title: '家庭主题 · 生字组词',
    description: '家、爸妈、爱、朋友，适合低年级的家庭练习。',
    badge: '生字组词',
    tags: ['家庭', '低年级', '组词'],
    type: 'hanziWords',
    pageTitle: '生字组词 · 家庭',
    content: words(
      '家 家庭 家乡',
      '爸 爸爸 爸妈',
      '妈 妈妈 母亲',
      '爱 爱心 热爱',
      '笑 笑声 微笑',
      '学 学习 学校',
      '书 书包 读书',
      '友 朋友 友好',
    ),
    settings: { gridSize: 40, fontSize: 72, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'wd-school',
    category: 'words',
    title: '校园主题 · 生字组词',
    description: '学校、老师、同学、上课，把校园常用词一次练完。',
    badge: '生字组词',
    tags: ['校园', '低年级', '组词'],
    type: 'hanziWords',
    pageTitle: '生字组词 · 校园',
    content: words(
      '校 学校 校园',
      '师 老师 师生',
      '同 同学 相同',
      '班 班级 上班',
      '课 上课 课本',
      '读 读书 朗读',
      '写 写字 书写',
      '听 听话 听见',
    ),
    settings: { gridSize: 44, fontSize: 72, showPinyin: true, titleHeight: 70 },
  },
  {
    id: 'poem-jingyesi',
    category: 'poem',
    title: '静夜思 · 李白',
    description: '五言绝句，适合低年级带拼音临写和默写。',
    badge: '古诗词',
    tags: ['唐诗', '李白', '五言绝句'],
    type: 'poem',
    pageTitle: '静夜思',
    content:
      '静夜思|李白|唐\n床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。\n注：疑，好像。',
    settings: {
      showPinyin: true,
      poemVertical: false,
      poemShowAuthor: true,
      poemShowNotes: true,
      titleHeight: 70,
    },
  },
  {
    id: 'poem-chunxiao',
    category: 'poem',
    title: '春晓 · 孟浩然',
    description: '春天的清晨，适合一年级起步和亲子共读。',
    badge: '古诗词',
    tags: ['唐诗', '孟浩然', '春天'],
    type: 'poem',
    pageTitle: '春晓',
    content: '春晓|孟浩然|唐\n春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。',
    settings: {
      showPinyin: true,
      poemVertical: false,
      poemShowAuthor: true,
      poemShowNotes: false,
      titleHeight: 70,
    },
  },
  {
    id: 'poem-yonge',
    category: 'poem',
    title: '咏鹅 · 骆宾王',
    description: '画面感强的启蒙诗，适合低年级描红。',
    badge: '古诗词',
    tags: ['唐诗', '骆宾王', '启蒙'],
    type: 'poem',
    pageTitle: '咏鹅',
    content: '咏鹅|骆宾王|唐\n鹅，鹅，鹅，\n曲项向天歌。\n白毛浮绿水，\n红掌拨清波。',
    settings: {
      showPinyin: true,
      poemVertical: false,
      poemShowAuthor: true,
      poemShowNotes: false,
      titleHeight: 70,
    },
  },
  {
    id: 'poem-dengguanquelou',
    category: 'poem',
    title: '登鹳雀楼 · 王之涣',
    description: '经典五言绝句，适合竖排作品纸练习。',
    badge: '古诗词',
    tags: ['唐诗', '王之涣', '五言绝句'],
    type: 'poem',
    pageTitle: '登鹳雀楼',
    content:
      '登鹳雀楼|王之涣|唐\n白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。',
    settings: {
      showPinyin: true,
      poemVertical: true,
      poemShowAuthor: true,
      poemShowNotes: false,
      titleHeight: 70,
    },
  },
  {
    id: 'poem-minnong',
    category: 'poem',
    title: '悯农 · 李绅',
    description: '珍惜粮食主题，适合配合德育和默写。',
    badge: '古诗词',
    tags: ['唐诗', '李绅', '德育'],
    type: 'poem',
    pageTitle: '悯农',
    content:
      '悯农|李绅|唐\n锄禾日当午，\n汗滴禾下土。\n谁知盘中餐，\n粒粒皆辛苦。',
    settings: {
      showPinyin: true,
      poemVertical: false,
      poemShowAuthor: true,
      poemShowNotes: false,
      titleHeight: 70,
    },
  },
  ...GRADE_PRESETS,
];

export const WORKBOOK_PRESETS: WorkbookPreset[] = [
  {
    id: 'wb-g4a-u1',
    category: 'workbook',
    grade: '四年级',
    semester: '上册',
    title: '四年级上册 · 第一单元练习册',
    description:
      '按「结构 → 生字 → 组词 → 段落 → 空白练习」排好顺序，一键生成 5 张字帖，导出就是一本练习册。',
    badge: '5 个章节 · 示例',
    tags: ['四年级', '第一单元', '练习册'],
    sections: [
      {
        type: 'hanzi',
        title: '第一步 · 左右结构：左窄右宽',
        content: STRUCTURE_LEFT_RIGHT,
        settings: { gridSize: 42, fontSize: 78, showPinyin: true, titleHeight: 70 },
      },
      {
        type: 'hanzi',
        title: '第二步 · 单元生字描红',
        content: TEXTBOOK_G4_U1,
        settings: { gridSize: 40, fontSize: 78, showPinyin: true, titleHeight: 70 },
      },
      {
        type: 'hanziWords',
        title: '第三步 · 生字组词',
        content: words(
          '牵 牵挂 牵头',
          '逊 逊色 谦逊',
          '疏 稀疏 疏远',
          '潮 潮水 观潮',
          '堤 堤坝 河堤',
          '霎 霎时 霎那',
          '余 余下 剩余',
          '耀 耀眼 闪耀',
        ),
        settings: { gridSize: 44, fontSize: 72, showPinyin: true, titleHeight: 70 },
      },
      {
        type: 'hanziParagraph',
        title: '第四步 · 段落临写',
        content: PARAGRAPH_SPRING,
        settings: { gridSize: 32, fontSize: 68, showPinyin: false, titleHeight: 70 },
      },
      {
        type: 'blank',
        title: '第五步 · 空白练习页',
        content: '',
        settings: { gridStyle: 'fang', gridSize: 40, showBorder: true, titleHeight: 70 },
      },
    ],
  },
  ...GRADE_WORKBOOK_PRESETS,
];

export function isWorkbookPreset(preset: Preset): preset is WorkbookPreset {
  return preset.category === 'workbook';
}

export function presetById(id: string): Preset | undefined {
  return [...SHEET_PRESETS, ...WORKBOOK_PRESETS].find((preset) => preset.id === id);
}

export function presetShareUrl(id: string): string {
  // 桌面版从 file:// 或本地开发服务器启动，分享链接要指向网页版。
  const base =
    window.desktop?.isElectron || window.location.protocol === 'file:'
      ? 'https://copycraft.looplooptech.com/'
      : window.location.href;
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('preset', id);
  return url.toString();
}
