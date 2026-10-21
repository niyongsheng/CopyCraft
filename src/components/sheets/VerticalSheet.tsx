import { fontStack } from '../../lib/fonts';
import type { VerticalModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

export function VerticalSheet({
  model,
  settings,
  title,
}: {
  model: VerticalModel;
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
            className="vertical-grid"
            style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }}
          >
            {page.map((problem) => (
              <div
                className="vertical-block"
                key={problem.id}
                style={{ height: model.blockHeight }}
              >
                <div
                  className="vertical-stack"
                  style={{
                    fontFamily: fontStack(settings.fontId),
                    fontSize: model.fontPx,
                    fontWeight: settings.fontWeight,
                    color: settings.traceColor,
                    transform: `translate(${settings.offsetX * 0.35}px, ${settings.offset * 0.35}px)`,
                  }}
                >
                  <div className="v-row">
                    <span className="v-num">{problem.a}</span>
                  </div>
                  <div className="v-row">
                    <span className="v-op">{problem.op}</span>
                    <span className="v-num">{problem.b}</span>
                  </div>
                  <div className="v-rule" />
                  <div className="v-answer-space" />
                </div>
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
