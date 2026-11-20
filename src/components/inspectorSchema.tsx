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
import {
  FONT_GROUP_KEYS,
  FONT_LABEL_KEYS,
  WEIGHT_LABEL_KEYS,
  type I18nKey,
} from '../i18n';
import { useT } from '../i18n/useT';
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
  | 'verticalOperation'
  | 'verticalDigits'
  | 'verticalCarry'
  | 'abacusMode'
  | 'abacusRods'
  | 'abacusTerms'
  | 'expressionOperation'
  | 'expressionSteps'
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
      label: I18nKey;
      min: number;
      max: number;
      step?: number;
      unit?: string;
      hidden?: When;
    }
  | {
      kind: 'select';
      key: SelectKey;
      label: I18nKey;
      options: { value: string | number; label: I18nKey }[];
      hidden?: When;
    }
  | {
      kind: 'toggle';
      key: BooleanKey;
      label: I18nKey;
      hint?: I18nKey;
      disabled?: When;
      hidden?: When;
    }
  | { kind: 'color'; key: ColorKey; label: I18nKey; hidden?: When }
  | { kind: 'font'; hidden?: When }
  | { kind: 'grid'; hidden?: When }
  | { kind: 'note'; text: I18nKey; icon?: boolean; hidden?: When }
  | { kind: 'titleText'; hidden?: When };

export interface CardDef {
  label: I18nKey;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  hidden?: When;
  controls: ControlDef[];
}

const MATH_OPERATION_OPTIONS = [
  { value: 'add', label: 'opt.addOnly' },
  { value: 'sub', label: 'opt.subOnly' },
  { value: 'both', label: 'opt.bothOps' },
] satisfies { value: string; label: I18nKey }[];

const MATH_MODE_OPTIONS = [
  { value: 'calc', label: 'opt.calc' },
  { value: 'fill', label: 'opt.fill' },
] satisfies { value: string; label: I18nKey }[];

const VERTICAL_OPERATION_OPTIONS = [
  { value: 'add', label: 'opt.add' },
  { value: 'sub', label: 'opt.sub' },
  { value: 'both', label: 'opt.bothOps' },
  { value: 'mul', label: 'opt.mul' },
  { value: 'div', label: 'opt.div' },
  { value: 'mixed', label: 'opt.mixed' },
] satisfies { value: string; label: I18nKey }[];

const VERTICAL_DIGIT_OPTIONS = [
  { value: 2, label: 'opt.twoDigit' },
  { value: 3, label: 'opt.threeDigit' },
] satisfies { value: number; label: I18nKey }[];

const VERTICAL_CARRY_OPTIONS = [
  { value: 'any', label: 'opt.any' },
  { value: 'require', label: 'opt.carryRequired' },
  { value: 'avoid', label: 'opt.carryAvoid' },
] satisfies { value: string; label: I18nKey }[];

const ABACUS_MODE_OPTIONS = [
  { value: 'read', label: 'opt.abacusRead' },
  { value: 'draw', label: 'opt.abacusDraw' },
  { value: 'calc', label: 'opt.abacusCalc' },
] satisfies { value: string; label: I18nKey }[];

const ABACUS_ROD_OPTIONS = [
  { value: 1, label: 'opt.oneDigit' },
  { value: 2, label: 'opt.twoDigit' },
  { value: 3, label: 'opt.threeDigit' },
  { value: 4, label: 'opt.fourDigit' },
] satisfies { value: number; label: I18nKey }[];

const ABACUS_TERM_OPTIONS = [
  { value: 2, label: 'opt.twoTerms' },
  { value: 3, label: 'opt.threeTerms' },
  { value: 4, label: 'opt.fourTerms' },
] satisfies { value: number; label: I18nKey }[];

const EXPRESSION_OPERATION_OPTIONS = [
  { value: 'addSub', label: 'opt.addSub' },
  { value: 'mulDiv', label: 'opt.mulDiv' },
  { value: 'mixed', label: 'opt.mixed' },
] satisfies { value: string; label: I18nKey }[];

const EXPRESSION_STEP_OPTIONS = [
  { value: 2, label: 'opt.twoSteps' },
  { value: 3, label: 'opt.threeSteps' },
] satisfies { value: number; label: I18nKey }[];

const CLOCK_MODE_OPTIONS = [
  { value: 'read', label: 'opt.readTime' },
  { value: 'draw', label: 'opt.drawTime' },
] satisfies { value: string; label: I18nKey }[];

const CLOCK_FACE_OPTIONS = [
  { value: 'arabic', label: 'opt.arabic' },
  { value: 'roman', label: 'opt.roman' },
  { value: 'none', label: 'opt.none' },
] satisfies { value: string; label: I18nKey }[];

const CLOCK_MINUTE_OPTIONS = [
  { value: 'any', label: 'opt.anyTime' },
  { value: '5', label: 'opt.fiveMin' },
  { value: '15', label: 'opt.onTheHour' },
] satisfies { value: string; label: I18nKey }[];

const FONT_WEIGHT_OPTIONS = FONT_WEIGHTS.map((weight) => ({
  value: weight.value,
  label: WEIGHT_LABEL_KEYS[weight.value],
}));

const FONT_GROUPS: { label: I18nKey; options: { value: string; label: I18nKey }[] }[] = [
  {
    label: FONT_GROUP_KEYS['中文'],
    options: FONTS.filter((font) => font.group === '中文').map((font) => ({
      value: font.id,
      label: FONT_LABEL_KEYS[font.id],
    })),
  },
  {
    label: FONT_GROUP_KEYS['英文'],
    options: FONTS.filter((font) => font.group === '英文').map((font) => ({
      value: font.id,
      label: FONT_LABEL_KEYS[font.id],
    })),
  },
];

const NAME_CARD: CardDef = {
  label: 'card.nameStroke',
  icon: Sparkles,
  controls: [
    {
      kind: 'toggle',
      key: 'nameStrokeOrder',
      label: 'ctl.nameStrokeOrder',
      hint: 'ctl.nameStrokeOrderHint',
    },
    {
      kind: 'toggle',
      key: 'nameTruncateAfterStrokes',
      label: 'ctl.nameTruncate',
      hint: 'ctl.nameTruncateHint',
      disabled: ({ settings }) => !settings.nameStrokeOrder,
    },
    {
      kind: 'toggle',
      key: 'nameNoRepeat',
      label: 'ctl.nameNoRepeat',
      hint: 'ctl.nameNoRepeatHint',
    },
    {
      kind: 'note',
      icon: true,
      text: 'ctl.nameStrokeNote',
      hidden: ({ settings }) => !settings.nameStrokeOrder,
    },
  ],
};

const CLOCK_CARD: CardDef = {
  label: 'card.clock',
  icon: Clock3,
  controls: [
    { kind: 'select', key: 'clockMode', label: 'ctl.clockMode', options: CLOCK_MODE_OPTIONS },
    { kind: 'select', key: 'clockFace', label: 'ctl.clockFace', options: CLOCK_FACE_OPTIONS },
    {
      kind: 'select',
      key: 'clockMinute',
      label: 'ctl.clockMinute',
      options: CLOCK_MINUTE_OPTIONS,
    },
    { kind: 'toggle', key: 'clock24h', label: 'ctl.clock24h' },
    { kind: 'toggle', key: 'clockShowTime', label: 'ctl.clockShowTime' },
    { kind: 'slider', key: 'count', label: 'ctl.count', min: 5, max: 60 },
  ],
};

const PEN_CARD: CardDef = {
  label: 'card.pen',
  icon: Brush,
  controls: [{ kind: 'note', text: 'ctl.penNote' }],
};

const LAYOUT_CARD: CardDef = {
  label: 'card.layout',
  icon: SlidersHorizontal,
  controls: [
    {
      kind: 'slider',
      key: 'lineSpacing',
      label: 'ctl.lineSpacing',
      min: 0,
      max: 24,
      unit: 'px',
      hidden: ({ meta }) => isGeneratedSheet(meta),
    },
    { kind: 'slider', key: 'hMargin', label: 'ctl.hMargin', min: 12, max: 100, unit: 'px' },
    { kind: 'slider', key: 'vMargin', label: 'ctl.vMargin', min: 12, max: 100, unit: 'px' },
    { kind: 'slider', key: 'fontSize', label: 'ctl.fontSize', min: 30, max: 120, unit: '%' },
    { kind: 'slider', key: 'offset', label: 'ctl.offset', min: -20, max: 20, unit: 'px' },
    { kind: 'slider', key: 'offsetX', label: 'ctl.offsetX', min: -20, max: 20, unit: 'px' },
    { kind: 'font' },
    {
      kind: 'select',
      key: 'fontWeight',
      label: 'ctl.fontWeight',
      options: FONT_WEIGHT_OPTIONS,
    },
    {
      kind: 'toggle',
      key: 'showPinyin',
      label: 'ctl.pinyin',
      hidden: ({ meta }) => !meta.showPinyinOption,
    },
    {
      kind: 'toggle',
      key: 'showText',
      label: 'ctl.text',
      hidden: ({ meta }) => !meta.showTextOption,
    },
  ],
};

const GRID_CARD: CardDef = {
  label: 'card.grid',
  icon: Grid3X3,
  controls: [
    { kind: 'grid' },
    { kind: 'slider', key: 'gridSize', label: 'ctl.gridSize', min: 20, max: 80 },
    { kind: 'color', key: 'borderColor', label: 'ctl.borderColor' },
    { kind: 'color', key: 'lineColor', label: 'ctl.lineColor' },
    { kind: 'color', key: 'traceColor', label: 'ctl.traceColor' },
    { kind: 'toggle', key: 'showBorder', label: 'ctl.showBorder' },
  ],
};

const STYLE_CARD: CardDef = {
  label: 'card.style',
  icon: Palette,
  defaultOpen: false,
  controls: [
    { kind: 'color', key: 'borderColor', label: 'ctl.borderColor' },
    { kind: 'color', key: 'traceColor', label: 'ctl.traceColor' },
    { kind: 'toggle', key: 'showBorder', label: 'ctl.showBorder' },
  ],
};

const TITLE_CARD: CardDef = {
  label: 'card.title',
  icon: Type,
  defaultOpen: false,
  controls: [
    { kind: 'toggle', key: 'showTitle', label: 'ctl.showTitle' },
    { kind: 'titleText', hidden: ({ settings }) => !settings.showTitle },
    {
      kind: 'slider',
      key: 'titleHeight',
      label: 'ctl.titleHeight',
      min: 40,
      max: 120,
      unit: 'px',
      hidden: ({ settings }) => !settings.showTitle,
    },
  ],
};

const VERTICAL_CARD: CardDef = {
  label: 'card.vertical',
  icon: Calculator,
  controls: [
    {
      kind: 'select',
      key: 'verticalOperation',
      label: 'ctl.verticalOperation',
      options: VERTICAL_OPERATION_OPTIONS,
    },
    {
      kind: 'select',
      key: 'verticalDigits',
      label: 'ctl.verticalDigits',
      options: VERTICAL_DIGIT_OPTIONS,
    },
    {
      kind: 'select',
      key: 'verticalCarry',
      label: 'ctl.verticalCarry',
      options: VERTICAL_CARRY_OPTIONS,
      hidden: ({ settings }) =>
        settings.verticalOperation === 'mul' || settings.verticalOperation === 'div',
    },
    {
      kind: 'toggle',
      key: 'verticalAllowRemainder',
      label: 'ctl.verticalAllowRemainder',
      hint: 'ctl.verticalAllowRemainderHint',
      hidden: ({ settings }) =>
        settings.verticalOperation !== 'div' && settings.verticalOperation !== 'mixed',
    },
    { kind: 'slider', key: 'count', label: 'ctl.count', min: 4, max: 60 },
    {
      kind: 'note',
      text: 'ctl.verticalNote',
      hidden: ({ settings }) =>
        settings.verticalOperation !== 'mul' &&
        settings.verticalOperation !== 'div' &&
        settings.verticalOperation !== 'mixed',
    },
  ],
};

const ABACUS_CARD: CardDef = {
  label: 'card.abacus',
  icon: Calculator,
  controls: [
    {
      kind: 'select',
      key: 'abacusMode',
      label: 'ctl.abacusMode',
      options: ABACUS_MODE_OPTIONS,
    },
    {
      kind: 'select',
      key: 'abacusRods',
      label: 'ctl.abacusRods',
      options: ABACUS_ROD_OPTIONS,
    },
    {
      kind: 'select',
      key: 'abacusTerms',
      label: 'ctl.abacusTerms',
      options: ABACUS_TERM_OPTIONS,
      hidden: ({ settings }) => settings.abacusMode !== 'calc',
    },
    {
      kind: 'select',
      key: 'mathOperation',
      label: 'ctl.abacusOperation',
      options: MATH_OPERATION_OPTIONS,
      hidden: ({ settings }) => settings.abacusMode !== 'calc',
    },
    { kind: 'slider', key: 'count', label: 'ctl.count', min: 4, max: 24 },
    { kind: 'note', text: 'ctl.abacusNote' },
  ],
};

const EXPRESSION_CARD: CardDef = {
  label: 'card.expression',
  icon: Calculator,
  controls: [
    {
      kind: 'select',
      key: 'expressionOperation',
      label: 'ctl.expressionOperation',
      options: EXPRESSION_OPERATION_OPTIONS,
    },
    {
      kind: 'select',
      key: 'expressionSteps',
      label: 'ctl.expressionSteps',
      options: EXPRESSION_STEP_OPTIONS,
    },
    {
      kind: 'toggle',
      key: 'expressionParentheses',
      label: 'ctl.expressionParentheses',
      hint: 'ctl.expressionParenthesesHint',
      hidden: ({ settings }) => settings.expressionOperation === 'mixed',
    },
    { kind: 'slider', key: 'mathRange', label: 'ctl.mathRange', min: 5, max: 99 },
    { kind: 'slider', key: 'count', label: 'ctl.count', min: 4, max: 40 },
  ],
};

const POEM_CARD: CardDef = {
  label: 'card.poem',
  icon: Type,
  controls: [
    { kind: 'toggle', key: 'poemVertical', label: 'ctl.poemVertical' },
    { kind: 'toggle', key: 'poemShowAuthor', label: 'ctl.poemShowAuthor' },
    { kind: 'toggle', key: 'poemShowNotes', label: 'ctl.poemShowNotes' },
    { kind: 'note', text: 'ctl.poemNote' },
  ],
};

const ENGLISH_WORD_CARD: CardDef = {
  label: 'card.word',
  icon: Type,
  controls: [
    { kind: 'toggle', key: 'englishWordShowMeaning', label: 'ctl.englishWordShowMeaning' },
    { kind: 'note', text: 'ctl.englishWordNote' },
  ],
};

function mathCard(meta: SheetMeta): CardDef {
  const isTimesTable = meta.id === 'multiplication' || meta.id === 'division';
  return {
    label: 'card.math',
    icon: Calculator,
    controls: [
      ...(meta.id === 'addSub'
        ? ([
            {
              kind: 'select',
              key: 'mathOperation',
              label: 'ctl.mathOperation',
              options: MATH_OPERATION_OPTIONS,
            },
            {
              kind: 'select',
              key: 'mathMode',
              label: 'ctl.mathMode',
              options: MATH_MODE_OPTIONS,
            },
          ] satisfies ControlDef[])
        : []),
      {
        kind: 'slider',
        key: 'mathRange',
        label: isTimesTable ? 'ctl.mathRangeTable' : 'ctl.mathRange',
        min: isTimesTable ? 2 : 5,
        max: isTimesTable ? 12 : 99,
      },
      { kind: 'slider', key: 'count', label: 'ctl.count', min: 4, max: 120 },
    ],
  };
}

/** Cards shown in the inspector for a given sheet, in display order. */
export function inspectorCards(meta: SheetMeta): CardDef[] {
  return [
    ...(meta.id === 'name' ? [NAME_CARD] : []),
    ...(meta.kind === 'math' ? [mathCard(meta)] : []),
    ...(meta.kind === 'vertical' ? [VERTICAL_CARD] : []),
    ...(meta.kind === 'expression' ? [EXPRESSION_CARD] : []),
    ...(meta.kind === 'abacus' ? [ABACUS_CARD] : []),
    ...(meta.kind === 'poem' ? [POEM_CARD] : []),
    ...(meta.id === 'englishWords' ? [ENGLISH_WORD_CARD] : []),
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
  const t = useT();
  const ctx = { meta, settings };
  return (
    <>
      {cards.map((card) => {
        if (card.hidden?.(ctx)) return null;
        const Icon = card.icon;
        return (
          <Section
            key={card.label}
            label={t(card.label)}
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
  const t = useT();
  if (control.hidden?.(ctx)) return null;

  switch (control.kind) {
    case 'slider':
      return (
        <SliderRow
          label={t(control.label)}
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
          label={t(control.label)}
          value={settings[control.key]}
          options={control.options.map((option) => ({
            value: option.value,
            label: t(option.label),
          }))}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'toggle':
      return (
        <ToggleRow
          label={t(control.label)}
          hint={control.hint ? t(control.hint) : undefined}
          checked={settings[control.key]}
          disabled={control.disabled?.(ctx)}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'color':
      return (
        <ColorRow
          label={t(control.label)}
          value={settings[control.key]}
          onChange={(value) => onChange(control.key, value)}
        />
      );
    case 'font':
      return (
        <SelectRow
          label={t('ctl.font')}
          value={settings.fontId}
          options={[]}
          groups={FONT_GROUPS.map((group) => ({
            label: t(group.label),
            options: group.options.map((option) => ({
              value: option.value,
              label: t(option.label),
            })),
          }))}
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
          <span>{t(control.text)}</span>
        </p>
      );
    case 'titleText':
      return (
        <TextRow
          label={t('ctl.titleText')}
          value={title}
          onChange={onTitleChange}
          maxLength={40}
        />
      );
  }
}
