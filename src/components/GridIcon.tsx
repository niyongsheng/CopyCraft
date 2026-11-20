import { GRID_STYLE_KEYS } from '../i18n';
import { useT } from '../i18n/useT';
import { GRID_STYLES } from '../lib/constants';
import { gridGeometry } from '../lib/grid';
import type { GridStyleId } from '../types';

export function GridIcon({ id }: { id: GridStyleId }) {
  const geometry = gridGeometry(id);
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.1,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };
  const dash = { strokeDasharray: '2 2', opacity: 0.75 };
  const hasRules = geometry.rules.length > 0;

  return (
    <svg viewBox="-8 -8 116 116" width="28" height="28" aria-hidden="true">
      {hasRules ? (
        <g>
          {geometry.rules.map((rule) => (
            <line
              key={rule.y}
              x1="0"
              y1={rule.y}
              x2="100"
              y2={rule.y}
              {...common}
              {...(rule.solid ? {} : dash)}
            />
          ))}
          {geometry.iconRules.map((y) => (
            <line key={`icon-${y}`} x1="0" y1={y} x2="100" y2={y} {...common} />
          ))}
        </g>
      ) : (
        <>
          <rect x="0" y="0" width="100" height="100" rx="5" {...common} />
          {geometry.guides.map((shape, index) =>
            shape.kind === 'line' ? (
              <line
                key={index}
                x1={shape.x1}
                y1={shape.y1}
                x2={shape.x2}
                y2={shape.y2}
                {...common}
                {...dash}
              />
            ) : (
              <rect
                key={index}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                {...common}
                {...dash}
              />
            ),
          )}
        </>
      )}
    </svg>
  );
}

export function GridStylePicker({
  value,
  onChange,
}: {
  value: GridStyleId;
  onChange: (value: GridStyleId) => void;
}) {
  const t = useT();
  return (
    <div className="grid-picker">
      {GRID_STYLES.map((style) => (
        <button
          key={style.id}
          type="button"
          title={t(GRID_STYLE_KEYS[style.id])}
          aria-label={t(GRID_STYLE_KEYS[style.id])}
          className={`grid-picker-item ${value === style.id ? 'is-active' : ''}`}
          onClick={() => onChange(style.id)}
        >
          <GridIcon id={style.id} />
        </button>
      ))}
    </div>
  );
}
