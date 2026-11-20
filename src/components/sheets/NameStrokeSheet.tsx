import { fontStack } from '../../lib/fonts';
import type { NameStrokeCell, NameStrokeModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { StrokeGlyph } from '../StrokeGlyph';
import { GridPages } from './GridPages';

export function NameStrokeSheet({
  model,
  settings,
  title,
  name,
}: {
  model: NameStrokeModel;
  settings: SheetSettings;
  title: string;
  name?: string;
}) {
  const font = fontStack(settings.fontId);
  const glyphSize = model.cellW * 0.9;
  const hasStrokes = (cell: NameStrokeCell) =>
    cell.kind === 'stage' && cell.stage > 0 && Boolean(model.strokeData[cell.char]);

  return (
    <GridPages
      model={model}
      settings={settings}
      title={title}
      name={name}
      pinyinOf={(cell) => cell.label}
      charLabel={(cell) => cell.char || undefined}
      charStyle={(cell) =>
        hasStrokes(cell)
          ? {}
          : {
              fontSize: model.charPx,
              lineHeight: 1,
              fontFamily: font,
              fontWeight: settings.fontWeight,
              color: cell.kind === 'repeat' ? settings.traceColor : settings.inkColor,
              transform: `translate(${settings.offsetX}px, ${settings.offset}px)`,
            }
      }
      renderCell={(cell) =>
        hasStrokes(cell) ? (
          <StrokeGlyph
            data={model.strokeData[cell.char]}
            stage={cell.stage}
            size={glyphSize}
            color={settings.inkColor}
            highlight={settings.borderColor}
          />
        ) : cell.kind === 'empty' ? null : cell.char
      }
    />
  );
}
