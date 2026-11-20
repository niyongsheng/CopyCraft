import { fontStack } from '../../lib/fonts';
import type { AbacusModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { Abacus } from '../Abacus';
import { PageFrame } from '../PageFrame';

export function AbacusSheet({
  model,
  settings,
  title,
}: {
  model: AbacusModel;
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
            className={`abacus-grid ${model.mode === 'calc' ? 'is-calc' : ''}`}
            style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }}
          >
            {page.map((problem) => (
              <div
                className="abacus-block"
                key={problem.id}
                style={{ minHeight: model.blockHeight }}
              >
                {model.mode === 'calc' ? (
                  <div
                    className="abacus-calc"
                    style={{
                      fontFamily: font,
                      fontSize: model.fontPx,
                      fontWeight: settings.fontWeight,
                      color: settings.inkColor,
                    }}
                  >
                    <span className="abacus-index">{problem.id}.</span>
                    <span>{problem.expression}</span>
                    <span
                      className="abacus-calc-answer"
                      style={{ borderColor: settings.lineColor }}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="abacus-prompt"
                      style={{
                        fontFamily: font,
                        fontSize: model.fontPx,
                        fontWeight: settings.fontWeight,
                        color: settings.inkColor,
                      }}
                    >
                      <span className="abacus-index">{problem.id}.</span>
                      {model.mode === 'draw' && (
                        <span className="abacus-number">{problem.value}</span>
                      )}
                    </div>
                    <Abacus
                      rods={model.rods}
                      value={model.mode === 'read' ? problem.value : undefined}
                      width={model.abacusWidth}
                      frameColor={settings.borderColor}
                      lineColor={settings.lineColor}
                      beadColor={settings.inkColor}
                      idleColor={settings.traceColor}
                    />
                    {model.mode === 'read' && (
                      <span
                        className="abacus-answer"
                        style={{ borderColor: settings.lineColor }}
                      />
                    )}
                    {model.mode === 'draw' && (
                      <span
                        className="abacus-caption"
                        style={{ color: settings.traceColor }}
                      >
                        看数拨珠
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
