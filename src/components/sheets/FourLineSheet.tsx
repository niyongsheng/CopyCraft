import { fontStack } from '../../lib/fonts';
import { rowGridStyle } from '../../lib/grid';
import type { FourLineModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

export function FourLineSheet({
  model,
  settings,
  title,
  showText = true,
}: {
  model: FourLineModel;
  settings: SheetSettings;
  title: string;
  showText?: boolean;
}) {
  const tile = {
    borderColor: settings.borderColor,
    lineColor: settings.lineColor,
    showBorder: settings.showBorder,
  };
  const font = fontStack(settings.fontId);

  return (
    <>
      {model.pages.map((page, pageIndex) => (
        <PageFrame key={pageIndex} settings={settings} title={title}>
          <div className="fourline-frame">
            {page.rows.map((row, rowIndex) => (
              <div
                className="fourline-row"
                data-grid-tile=""
                key={rowIndex}
                style={{
                  height: model.rowH,
                  marginBottom: settings.lineSpacing,
                  ...rowGridStyle(settings.gridStyle, tile, model.cellW, model.rowH),
                }}
              >
                {showText && row.text && !row.empty && (
                  <div
                    className="fourline-text"
                    style={{
                      fontFamily: font,
                      fontSize: model.charPx,
                      fontWeight: settings.fontWeight,
                      columnGap: model.gap,
                      transform: `translate(${settings.offsetX * 0.5}px, ${settings.offset * 0.5}px)`,
                    }}
                  >
                    <span
                      className="fourline-segment"
                      style={{ color: row.paragraph ? settings.traceColor : settings.inkColor }}
                    >
                      {row.text}
                    </span>
                    {!row.paragraph &&
                      Array.from({ length: Math.max(0, row.repeatCount - 1) }).map((_, i) => (
                        <span
                          className="fourline-segment"
                          key={i}
                          style={{ color: settings.traceColor }}
                        >
                          {row.text}
                        </span>
                      ))}
                    {row.meaning && (
                      <span className="fourline-meaning">{row.meaning}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
