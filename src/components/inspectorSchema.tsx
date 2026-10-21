import type { LucideIcon } from 'lucide-react';
import {
  Brush,
  Calculator,
  Clock3,
  Grid3X3,
  Info,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Type,
} from 'lucide-react';
import { isGeneratedSheet } from '../lib/constants';
import { FONTS, FONT_WEIGHTS } from '../lib/fonts';
import type { SheetMeta, SheetSettings } from '../types';
import { ColorRow, Section, SelectRow, SliderRow, TextRow, ToggleRow } from './controls';
import { GridStylePicker } from './GridIcon';

export type SettingsKey = keyof SheetSettings;
export type SettingsValue = SheetSettings[SettingsKey];

type NumericKey = {
  [K in keyof SheetSettings]: SheetSettings[K] extends number ? K : never;
}[keyof SheetSettings];
type BooleanKey = {
  [K in keyof SheetSettings]: SheetSettings[K] extends boolean ? K : never;
}[keyof SheetSettings];
type ColorKey = 'borderColor' | 'lineColor' | 'traceColor';
type SelectKey =
  | 'mathOperation'
  | 'mathMode'
  | 'clockMode'
  | 'clockFace'
  | 'clockMinute'
  | 'fontWeight';

interface WhenContext {
  meta: SheetMeta;
  settings: SheetSettings;
}

type When = (ctx: WhenContext) => boolean;

type ControlDef =
  | {
      kind: 'slider';
      key: NumericKey;
      label: string;
      min: number;
      max: number;
      step?: number;
      unit?: string;
      hidden?: When;
    }
  | {
      kind: 'select';
      key: SelectKey;
      label: string;
      options: { value: string | number; label: string }[];
      hidden?: When;
    }
  | {
      kind: 'toggle';
      key: BooleanKey;
      label: string;
      hint?: string;
      disabled?: When;
      hidden?: When;
    }
  | { kind: 'color'; key: ColorKey; label: string; hidden?: When }
  | { kind: 'font'; hidden?: When }
  | { kind: 'grid'; hidden?: When }
  | { kind: 'note'; text: string; icon?: boolean; hidden?: When }
  | { kind: 'titleText'; hidden?: When };

export interface CardDef {
  label: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  hidden?: When;
  controls: ControlDef[];
}

const MATH_OPERATION_OPTIONS = [
  { value: 'add', label: '仅加法' },
  { value: 'sub', label: '仅减法' },
  { value: 'both', label: '加减混合' },
];

const MATH_MODE_OPTIONS = [
  { value: 'calc', label: '运算' },
  { value: 'fill', label: '填空' },
];

const CLOCK_MODE_OPTIONS = [
  { value: 'read', label: '读取时间' },
  { value: 'draw', label: '刻画时间' },
];

const CLOCK_FACE_OPTIONS = [
  { value: 'arabic', label: '阿拉伯数字' },
  { value: 'roman', label: '罗马数字' },
  { value: 'none', label: '无数字' },
];

const CLOCK_MINUTE_OPTIONS = [
  { value: 'any', label: '任意时间' },
  { value: '5', label: '5 分钟' },
  { value: '15', label: '整点 / 半点' },
];

const FONT_WEIGHT_OPTIONS = FONT_WEIGHTS.map((weight) => ({
  value: weight.value,
  label: weight.label,
}));

const FONT_GROUPS = [
  {
    label: '中文',
    options: FONTS.filter((font) => font.group === '中文').map((font) => ({
      value: font.id,
      label: font.label,
    })),
  },
  {
    label: '英文',
    options: FONTS.filter((font) => font.group === '英文').map((font) => ({
      value: font.id,
      label: font.label,
    })),
  },
];

const NAME_CARD: CardDef = {
  label: '姓名笔顺',
  icon: Sparkles,
  controls: [
    {
      kind: 'toggle',
      key: 'nameStrokeOrder',
      label: '按笔顺显示',
      hint: '把姓名拆成逐笔推进的示范格',
    },
    {
      kind: 'toggle',
      key: 'nameTruncateAfterStrokes',
      label: '笔画完毕截断',
      hint: '写完最后一笔后，行尾不再填充整字',
      disabled: ({ settings }) => !settings.nameStrokeOrder,
    },
    {
      kind: 'toggle',
      key: 'nameNoRepeat',
      label: '不重复生成',
      hint: '每个名字只出现一遍，不重复铺满整行',
    },
    {
      kind: 'note',
      icon: true,
      text: '首次开启需联网加载笔顺数据，加载后自动显示示范。',
      hidden: ({ settings }) => !settings.nameStrokeOrder,
    },
  ],
};

const CLOCK_CARD: CardDef = {
  label: '时钟',
  icon: Clock3,
  controls: [
    { kind: 'select', key: 'clockMode', label: '模式', options: CLOCK_MODE_OPTIONS },
    { kind: 'select', key: 'clockFace', label: '表盘', options: CLOCK_FACE_OPTIONS },
    { kind: 'select', key: 'clockMinute', label: '分针', options: CLOCK_MINUTE_OPTIONS },
    { kind: 'toggle', key: 'clock24h', label: '24 小时制' },
    { kind: 'toggle', key: 'clockShowTime', label: '显示时间' },
    { kind: 'slider', key: 'count', label: '题目数量', min: 5, max: 60 },
  ],
};

const PEN_CARD: CardDef = {
  label: '控笔',
  icon: Brush,
  controls: [
    {
      kind: 'note',
      text: '自动装订 24 种控笔线条图案，从直线、曲线到螺旋与迷宫，帮助孩子练习控笔方向与力度。',
    },
  ],
};

const LAYOUT_CARD: CardDef = {
  label: '排版',
  icon: SlidersHorizontal,
  controls: [
    {
      kind: 'slider',
      key: 'lineSpacing',
      label: '行间距',
      min: 0,
      max: 24,
      unit: 'px',
      hidden: ({ meta }) => isGeneratedSheet(meta),
    },
    { kind: 'slider', key: 'hMargin', label: '水平边距', min: 12, max: 100, unit: 'px' },
    { kind: 'slider', key: 'vMargin', label: '垂直边距', min: 12, max: 100, unit: 'px' },
    { kind: 'slider', key: 'fontSize', label: '大小', min: 30, max: 120, unit: '%' },
    { kind: 'slider', key: 'offset', label: '上下偏移', min: -20, max: 20, unit: 'px' },
    { kind: 'slider', key: 'offsetX', label: '左右偏移', min: -20, max: 20, unit: 'px' },
    { kind: 'font' },
    { kind: 'select', key: 'fontWeight', label: '粗细', options: FONT_WEIGHT_OPTIONS },
    {
      kind: 'toggle',
      key: 'showPinyin',
      label: '拼音',
      hidden: ({ meta }) => !meta.showPinyinOption,
    },
    {
      kind: 'toggle',
      key: 'showText',
      label: '文本',
      hidden: ({ meta }) => !meta.showTextOption,
    },
  ],
};

const GRID_CARD: CardDef = {
  label: '格子',
  icon: Grid3X3,
  controls: [
    { kind: 'grid' },
    { kind: 'slider', key: 'gridSize', label: '网格大小', min: 20, max: 80 },
    { kind: 'color', key: 'borderColor', label: '边框颜色' },
    { kind: 'color', key: 'lineColor', label: '线条颜色' },
    { kind: 'color', key: 'traceColor', label: '描红颜色' },
    { kind: 'toggle', key: 'showBorder', label: '显示边框' },
  ],
};

const STYLE_CARD: CardDef = {
  label: '样式',
  icon: Palette,
  defaultOpen: false,
  controls: [
    { kind: 'color', key: 'borderColor', label: '边框颜色' },
    { kind: 'color', key: 'traceColor', label: '描红颜色' },
    { kind: 'toggle', key: 'showBorder', label: '显示边框' },
  ],
};

const TITLE_CARD: CardDef = {
  label: '标题',
  icon: Type,
  defaultOpen: false,
  controls: [
    { kind: 'toggle', key: 'showTitle', label: '显示标题' },
    { kind: 'titleText', hidden: ({ settings }) => !settings.showTitle },
    {
      kind: 'slider',
      key: 'titleHeight',
      label: '高',
      min: 40,
      max: 120,
      unit: 'px',
      hidden: ({ settings }) => !settings.showTitle,
    },
  ],
};

function mathCard(meta: SheetMeta): CardDef {
  const isTimesTable = meta.id === 'multiplication' || meta.id === 'division';
  return {
    label: '题目',
    icon: Calculator,
    controls: [
      ...(meta.id === 'addSub'
        ? ([
            { kind: 'select', key: 'mathOperation', label: '运算', options: MATH_OPERATION_OPTIONS },
            { kind: 'select', key: 'mathMode', label: '模式', options: MATH_MODE_OPTIONS },
          ] satisfies ControlDef[])
        : []),
      {
        kind: 'slider',
        key: 'mathRange',
        label: isTimesTable ? '口诀范围' : '范围',
        min: isTimesTable ? 2 : 5,
        max: isTimesTable ? 12 : 99,
      },
      { kind: 'slider', key: 'count', label: '题目数量', min: 4, max: 120 },
    ],
  };
}

/** Cards shown in the inspector for a given sheet, in display order. */
export function inspectorCards(meta: SheetMeta): CardDef[] {
  return [
    ...(meta.id === 'name' ? [NAME_CARD] : []),
    ...(meta.kind === 'math' ? [mathCard(meta)] : []),
    ...(meta.kind === 'clock' ? [CLOCK_CARD] : []),
    ...(meta.kind === 'pen' ? [PEN_CARD] : []),
    LAYOUT_CARD,
    ...(meta.showGridOptions ? [GRID_CARD] : []),
    ...(isGeneratedSheet(meta) ? [STYLE_CARD] : []),
    TITLE_CARD,
  ];
}

export function InspectorCards({
  cards,
  meta,
  settings,
  onChange,
  title,
  onTitleChange,
}: {
  cards: CardDef[];
  meta: SheetMeta;
  settings: SheetSettings;
  onChange: (key: SettingsKey, value: SettingsValue) => void;
  title: string;
  onTitleChange: (title: string) => void;
}) {
  const ctx = { meta, settings };
  return (
    <>
      {cards.map((card) => {
        if (card.hidden?.(ctx)) return null;
        const Icon = card.icon;
        return (
          <Section
            key={card.label}
            label={card.label}
            icon={Icon ? <Icon size={14} /> : undefined}
            defaultOpen={card.defaultOpen}
          >
            {card.controls.map((control, index) => (
              <ControlRow
                key={index}
                control={control}
                ctx={ctx}
                settings={settings}
                onChange={onChange}
                title={title}
                onTitleChange={onTitleChange}
              />
            ))}
          </Section>
        );
      })}
    </>
  );
}

function ControlRow({
  control,
  ctx,
  settings,
  onChange,
  title,
  onTitleChange,
}: {
  control: ControlDef;
  ctx: WhenContext;
  settings: SheetSettings;
  onChange: (key: SettingsKey, value: SettingsValue) => void;
  title: string;
  onTitleChange: (title: string) => void;
}) {
  if (control.hidden?.(ctx)) return null;

  switch (control.kind) {
    case 'slider':
      return (
        <SliderRow
          label={control.label}
          min={control.min}
          max={control.max}
          step={control.step}
          unit={control.unit}
          value={settings[control.key]}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'select':
      return (
        <SelectRow
          label={control.label}
          value={settings[control.key]}
          options={control.options}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'toggle':
      return (
        <ToggleRow
          label={control.label}
          hint={control.hint}
          checked={settings[control.key]}
          disabled={control.disabled?.(ctx)}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'color':
      return (
        <ColorRow
          label={control.label}
          value={settings[control.key]}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'font':
      return (
        <SelectRow
          label="字体"
          value={settings.fontId}
          options={[]}
          groups={FONT_GROUPS}
          onChange={(value) => onChange('fontId', value)}
        />
      );
    case 'grid':
      return (
        <GridStylePicker
          value={settings.gridStyle}
          onChange={(value) => onChange('gridStyle', value)}
        />
      );
    case 'note':
      return (
        <p className={`inspector-note ${control.icon ? 'has-icon' : ''}`}>
          {control.icon && <Info size={12} aria-hidden="true" />}
          <span>{control.text}</span>
        </p>
      );
    case 'titleText':
      return <TextRow label="文字" value={title} onChange={onTitleChange} maxLength={40} />;
  }
}
