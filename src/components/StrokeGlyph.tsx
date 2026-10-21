import type { CharData } from '../lib/hanziData';

export function StrokeGlyph({
  data,
  stage,
  size,
  color,
  highlight,
}: {
  data: CharData;
  stage: number;
  size: number;
  color: string;
  highlight: string;
}) {
  const strokes = data.strokes.slice(0, Math.max(0, stage));
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className="stroke-glyph"
      aria-hidden="true"
    >
      <g transform="translate(0 900) scale(1 -1)">
        {strokes.map((path, index) => (
          <path
            key={index}
            d={path}
            fill={index === strokes.length - 1 ? highlight : color}
          />
        ))}
      </g>
    </svg>
  );
}
