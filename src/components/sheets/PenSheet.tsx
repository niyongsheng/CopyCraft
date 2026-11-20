import { useMemo } from 'react';
import { PATTERNS } from '../../lib/generators/patterns';
import { frameShadowFor, rowGridStyle } from '../../lib/grid';
import type { PenModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

export function PenSheet({
  model,
  settings,
  title,
}: {
  model: PenModel;
  settings: SheetSettings;
  title: string;
}) {
  const tile = {
    borderColor: settings.borderColor,
    lineColor: settings.lineColor,
    showBorder: settings.showBorder,
  };
  const frameShadow = frameShadowFor(settings);
  const art = useMemo(
    () => new Map(PATTERNS.map((pattern) => [pattern.id, pattern.render(settings.traceColor)])),
    [settings.traceColor],
  );

  return (
    <PageFrame settings={settings} title={title}>
      <div className="grid-frame" style={{ boxShadow: frameShadow }}>
        {model.rows.map((patternId, rowIndex) => (
          <div
            className="grid-row"
            data-grid-tile=""
            key={rowIndex}
            style={{
              height: model.rowH,
              marginBottom: settings.lineSpacing,
              ...rowGridStyle(settings.gridStyle, tile, model.cellW, model.rowH),
            }}
          >
            {Array.from({ length: model.cols }).map((_, cellIndex) => (
              <div
                className="pen-cell"
                key={cellIndex}
                style={{ width: model.cellW, height: model.rowH }}
              >
                <svg viewBox="0 0 100 100" className="pen-art" aria-hidden="true">
                  {art.get(patternId) ?? art.get(PATTERNS[0].id)}
                </svg>
              </div>
            ))}
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
