import { Fragment } from 'react';
import { fontStack } from '../../lib/fonts';
import type { MathModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

function Expression({ text }: { text: string }) {
  const parts = text.split('___');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="math-blank">
              (<i />)
            </span>
          )}
        </Fragment>
      ))}
    </>
  );
}

export function MathSheet({
  model,
  settings,
  title,
}: {
  model: MathModel;
  settings: SheetSettings;
  title: string;
}) {
  return (
    <>
      {model.pages.map((page, pageIndex) => (
        <PageFrame
          key={pageIndex}
          settings={settings}
          title={title}
          framed={settings.showBorder}
        >
          <div
            className="math-grid"
            style={{
              gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))`,
              gridAutoRows: model.rowHeight,
            }}
          >
            {page.map((problem) => (
              <div
                className="math-problem"
                key={problem.id}
                style={{
                  fontFamily: fontStack(settings.fontId),
                  fontSize: model.fontPx,
                  fontWeight: settings.fontWeight,
                  color: settings.traceColor,
                  transform: `translate(${settings.offsetX * 0.35}px, ${settings.offset * 0.35}px)`,
                }}
              >
                <span className="math-index">
                  {String(problem.id).padStart(2, '0')}.
                </span>
                <span className="math-expression">
                  <Expression text={problem.expression} />
                </span>
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
