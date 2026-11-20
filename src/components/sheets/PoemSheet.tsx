import { useT } from '../../i18n/useT';
import { fontStack } from '../../lib/fonts';
import { gridTile, rowGridStyle } from '../../lib/grid';
import type { PoemModel } from '../../lib/model';
import { pinyinOf } from '../../lib/pinyin';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

export function PoemSheet({
  model,
  settings,
  title,
}: {
  model: PoemModel;
  settings: SheetSettings;
  title: string;
}) {
  const t = useT();
  const font = fontStack(settings.fontId);
  const tile = {
    borderColor: settings.borderColor,
    lineColor: settings.lineColor,
    showBorder: settings.showBorder,
  };
  const rowH = model.cellSize + model.pinyinH;
  const tileWithPinyin = {
    ...tile,
    pinyinRatio: model.pinyinH / Math.max(1, rowH),
  };

  return (
    <PageFrame
      settings={settings}
      title={model.title || title}
      aside={
        model.showAuthor && model.author ? (
          <span className="poem-author">{model.author}</span>
        ) : undefined
      }
    >
      {model.vertical ? (
        <div className="poem-vertical">
          {model.lines.map((line, lineIndex) => {
            const chars = Array.from(line);
            return (
              <div
                className="poem-column"
                data-grid-tile=""
                key={lineIndex}
                style={{
                  width: model.cellSize,
                  height: chars.length * model.cellSize,
                  backgroundImage: gridTile(settings.gridStyle, tile),
                  backgroundSize: `${model.cellSize}px ${model.cellSize}px`,
                  backgroundRepeat: 'repeat-y',
                }}
              >
                {chars.map((char, charIndex) => (
                  <span
                    className="poem-vchar"
                    key={charIndex}
                    style={{
                      height: model.cellSize,
                      fontFamily: font,
                      fontSize: model.cellSize * 0.76,
                      fontWeight: settings.fontWeight,
                      color: settings.inkColor,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="poem-horizontal">
          {model.lines.map((line, lineIndex) => {
            const chars = Array.from(line);
            return (
              <div
                className="poem-line"
                data-grid-tile=""
                key={lineIndex}
                style={{
                  width: chars.length * model.cellSize,
                  height: rowH,
                  ...rowGridStyle(
                    settings.gridStyle,
                    tileWithPinyin,
                    model.cellSize,
                    rowH,
                  ),
                }}
              >
                {chars.map((char, charIndex) => (
                  <div className="poem-cell" key={charIndex} style={{ width: model.cellSize }}>
                    {model.pinyinH > 0 && (
                      <span
                        className="poem-pinyin"
                        style={{
                          height: model.pinyinH,
                          fontSize: model.pinyinSize,
                          color: settings.inkColor,
                        }}
                      >
                        {pinyinOf(char)}
                      </span>
                    )}
                    <span
                      className="poem-char"
                      style={{
                        fontFamily: font,
                        fontSize: model.cellSize * 0.76,
                        fontWeight: settings.fontWeight,
                        color: settings.inkColor,
                      }}
                    >
                      {char}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {model.showNotes && model.notes.length > 0 && (
        <div
          className="poem-notes"
          style={{ fontFamily: font, color: settings.inkColor }}
        >
          {model.notes.map((note, index) => (
            <div key={index}>
              {t('poem.notePrefix')}
              {note}
            </div>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
