import { SHEET_BY_ID } from '../../lib/constants';
import type { SheetModel } from '../../lib/model';
import type { SheetSettings, SheetType } from '../../types';
import { AbacusSheet } from './AbacusSheet';
import { ClockSheet } from './ClockSheet';
import { ExpressionSheet } from './ExpressionSheet';
import { PoemSheet } from './PoemSheet';
import { FourLineSheet } from './FourLineSheet';
import { GridSheet } from './GridSheet';
import { MathSheet } from './MathSheet';
import { NameStrokeSheet } from './NameStrokeSheet';
import { PenSheet } from './PenSheet';
import { VerticalSheet } from './VerticalSheet';

/** Render one sheet model. Shared by the single-sheet stage and workbook mode. */
export function SheetView({
  type,
  model,
  settings,
  title,
  name,
}: {
  type: SheetType;
  model: SheetModel;
  settings: SheetSettings;
  title: string;
  name?: string;
}) {
  const meta = SHEET_BY_ID[type];

  switch (model.kind) {
    case 'grid':
      return (
        <GridSheet
          model={model}
          settings={settings}
          title={title}
          name={meta.id === 'name' ? name : undefined}
        />
      );
    case 'name-stroke':
      return (
        <NameStrokeSheet
          model={model}
          settings={settings}
          title={title}
          name={name ?? ''}
        />
      );
    case 'fourline':
      return (
        <FourLineSheet
          model={model}
          settings={settings}
          title={title}
          showText={meta.showTextOption ? settings.showText : true}
        />
      );
    case 'pen':
      return <PenSheet model={model} settings={settings} title={title} />;
    case 'math':
      return <MathSheet model={model} settings={settings} title={title} />;
    case 'vertical':
      return <VerticalSheet model={model} settings={settings} title={title} />;
    case 'abacus':
      return <AbacusSheet model={model} settings={settings} title={title} />;
    case 'expression':
      return <ExpressionSheet model={model} settings={settings} title={title} />;
    case 'poem':
      return <PoemSheet model={model} settings={settings} title={title} />;
    case 'clock':
      return <ClockSheet model={model} settings={settings} title={title} />;
  }
}
