import { lazy, Suspense } from 'react';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { TOOL_LABEL_KEYS } from '../../i18n';
import { useT } from '../../i18n/useT';
import { TOOL_BY_ID } from '../../lib/constants';
import { useApp } from '../../store/useApp';

const StrokeQuery = lazy(() =>
  import('../StrokeQuery').then((m) => ({ default: m.StrokeQuery })),
);

export function ToolStage({ active }: { active: boolean }) {
  const t = useT();
  const activeTool = useApp((s) => s.activeTool);
  const tool = TOOL_BY_ID[activeTool ?? 'strokeQuery'];
  const showInspector = useApp((s) => s.showInspector);
  const toggleInspector = useApp((s) => s.toggleInspector);

  return (
    <main className="stage" style={active ? undefined : { display: 'none' }}>
      <div className="stage-toolbar">
        <div className="stage-title">
          <div className="stage-heading">
            <span className="stage-eyebrow">{t('stage.tool')}</span>
            <span className="stage-name">{t(TOOL_LABEL_KEYS[tool.id])}</span>
          </div>
        </div>

        <div className="stage-actions">
          <button
            type="button"
            className={`icon-btn stage-inspector-btn ${showInspector ? 'is-on' : ''}`}
            title={t('common.settings')}
            aria-label={t('stage.toggleInspector')}
            onClick={toggleInspector}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <div className="workspace">
        <Suspense
          fallback={
            <div className="stage-loading">
              <Loader2 size={16} className="spin" />
              {t('stage.toolLoading')}
            </div>
          }
        >
          <StrokeQuery />
        </Suspense>
      </div>
    </main>
  );
}
