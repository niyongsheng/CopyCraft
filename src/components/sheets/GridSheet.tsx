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
      charStyle={(cell) => {
        const word = cell.role === 'word';
        const length = Math.max(1, Array.from(cell.text).length);
        return {
          fontSize: word
            ? model.charPx * Math.min(0.66, 1.28 / length)
            : model.charPx,
          lineHeight: 1,
          fontFamily: font,
          fontWeight: settings.fontWeight,
          color: word || !cell.model ? settings.traceColor : settings.inkColor,
          transform: `translate(${settings.offsetX}px, ${settings.offset}px)`,
        };
      }}
    />
  );
}
