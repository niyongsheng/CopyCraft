import { fontStack } from '../../lib/fonts';
import type { GridModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { GridPages } from './GridPages';

export function GridSheet({
  model,
  settings,
  title,
  name,
}: {
  model: GridModel;
  settings: SheetSettings;
  title: string;
  name?: string;
}) {
  const font = fontStack(settings.fontId);

  return (
    <GridPages
      model={model}
      settings={settings}
      title={title}
      name={name}
      pinyinOf={(cell) => cell.pinyin}
      renderCell={(cell) => cell.text}
      charStyle={(cell) => ({
        fontSize: model.charPx,
        lineHeight: 1,
        fontFamily: font,
        fontWeight: settings.fontWeight,
        color: cell.model ? settings.inkColor : settings.traceColor,
        transform: `translate(${settings.offsetX}px, ${settings.offset}px)`,
      })}
    />
  );
}
