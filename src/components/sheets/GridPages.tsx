import type { CSSProperties, ReactNode } from 'react';
import { frameShadowFor, rowGridStyle } from '../../lib/grid';
import type { SheetSettings } from '../../types';
import { NameBadge } from '../NameBadge';
import { PageFrame } from '../PageFrame';

interface GridPageModel<TCell> {
  cellW: number;
  rowH: number;
  pinyinH: number;
  pages: { rows: { cells: TCell[] }[] }[];
}

/** Shared A4 page/row/cell chrome for grid-based sheets. */
export function GridPages<TCell>({
  model,
  settings,
  title,
  name,
  pinyinOf,
  renderCell,
  charStyle,
  charLabel,
}: {
  model: GridPageModel<TCell>;
  settings: SheetSettings;
  title: string;
  name?: string;
  pinyinOf: (cell: TCell) => ReactNode;
  renderCell: (cell: TCell) => ReactNode;
  charStyle?: (cell: TCell) => CSSProperties;
  charLabel?: (cell: TCell) => string | undefined;
}) {
  const tile = {
    borderColor: settings.borderColor,
    lineColor: settings.lineColor,
    showBorder: settings.showBorder,
    pinyinRatio: model.pinyinH / model.rowH,
  };
  const frameShadow = frameShadowFor(settings);
  const pinyinSize = Math.max(8, Math.round(model.cellW * 0.26));

  return (
    <>
      {model.pages.map((page, pageIndex) => (
        <PageFrame
          key={pageIndex}
          settings={settings}
          title={title}
          aside={name && pageIndex === 0 ? <NameBadge name={name} settings={settings} /> : undefined}
        >
          <div className="grid-frame" style={{ boxShadow: frameShadow }}>
            {page.rows.map((row, rowIndex) => (
              <div
                className="grid-row"
                key={rowIndex}
                style={{
                  height: model.rowH,
                  marginBottom: settings.lineSpacing,
                  ...rowGridStyle(settings.gridStyle, tile, model.cellW, model.rowH),
                }}
              >
                {row.cells.map((cell, cellIndex) => (
                  <div className="grid-cell" key={cellIndex} style={{ width: model.cellW }}>
                    {model.pinyinH > 0 && (
                      <div
                        className="grid-pinyin"
                        style={{
                          height: model.pinyinH,
                          fontSize: pinyinSize,
                          color: settings.inkColor,
                        }}
                      >
                        {pinyinOf(cell)}
                      </div>
                    )}
                    <div
                      className="grid-char"
                      style={{ height: model.cellW, ...charStyle?.(cell) }}
                      aria-label={charLabel?.(cell)}
                    >
                      {renderCell(cell)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
