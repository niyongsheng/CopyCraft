import { fontStack } from '../../lib/fonts';
import type { ExpressionModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

export function ExpressionSheet({
  model,
  settings,
  title,
}: {
  model: ExpressionModel;
  settings: SheetSettings;
  title: string;
}) {
  const font = fontStack(settings.fontId);

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
            className="expression-grid"
            style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }}
          >
            {page.map((problem) => (
              <div
                className="expression-block"
                key={problem.id}
                style={{ minHeight: model.blockHeight }}
              >
                <div
                  className="expression-head"
                  style={{
                    fontFamily: font,
                    fontSize: model.fontPx,
                    fontWeight: settings.fontWeight,
                    color: settings.inkColor,
                  }}
                >
                  <span className="expression-index">{problem.id}.</span>
                  <span>{problem.expression}</span>
                </div>
                {Array.from({ length: model.steps }).map((_, index) => (
                  <div
                    className="expression-step"
                    key={index}
                    style={{
                      fontFamily: font,
                      fontSize: model.fontPx,
                      color: settings.traceColor,
                    }}
                  >
                    <span>=</span>
                    <span
                      className="expression-blank"
                      style={{ borderColor: settings.lineColor }}
                    />
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
