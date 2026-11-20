import { ABACUS, abacusViewBox } from '../lib/abacus';

/**
 * 一档一上珠四珠的算盘示意图。
 * `value` 为空时所有珠子处于静止位置（留给学生拨珠）。
 */
export function Abacus({
  rods,
  value,
  width,
  frameColor,
  lineColor,
  beadColor,
  idleColor,
}: {
  rods: number;
  value?: number;
  width: number;
  frameColor: string;
  lineColor: string;
  beadColor: string;
  idleColor: string;
}) {
  const { width: viewWidth, height: viewHeight } = abacusViewBox(rods);
  const digits =
    value == null
      ? Array.from({ length: rods }, () => 0)
      : String(value)
          .padStart(rods, '0')
          .slice(-rods)
          .split('')
          .map((part) => Number(part));

  const beamY = ABACUS.pad + ABACUS.upperDeck;
  const lowerTop = beamY + 6;
  const beadX = (center: number) => center - ABACUS.beadWidth / 2;
  const upperY = (active: boolean) =>
    active ? beamY - ABACUS.beadHeight - 4 : ABACUS.pad + 4;
  const lowerY = (index: number, activeCount: number) => {
    if (index < activeCount) return lowerTop + index * ABACUS.slot;
    return lowerTop + (1 + activeCount + (index - activeCount)) * ABACUS.slot;
  };

  return (
    <svg
      className="abacus-svg"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={width}
      height={width * (viewHeight / viewWidth)}
      aria-hidden="true"
    >
      <rect
        x={1}
        y={1}
        width={viewWidth - 2}
        height={viewHeight - 2}
        rx={6}
        fill="none"
        stroke={frameColor}
        strokeWidth={1.6}
      />
      <line
        x1={ABACUS.pad / 2}
        y1={beamY}
        x2={viewWidth - ABACUS.pad / 2}
        y2={beamY}
        stroke={lineColor}
        strokeWidth={2}
      />
      {Array.from({ length: rods }, (_, rod) => {
        const center = ABACUS.pad + rod * ABACUS.rodGap + ABACUS.rodGap / 2;
        const digit = digits[rod] ?? 0;
        const upperActive = digit >= 5;
        const lowerActive = digit % 5;

        return (
          <g key={rod}>
            <line
              x1={center}
              y1={ABACUS.pad}
              x2={center}
              y2={viewHeight - ABACUS.pad}
              stroke={lineColor}
              strokeWidth={1}
              opacity={0.45}
            />
            <rect
              x={beadX(center)}
              y={upperY(upperActive)}
              width={ABACUS.beadWidth}
              height={ABACUS.beadHeight}
              rx={ABACUS.beadHeight / 2}
              fill={upperActive ? beadColor : idleColor}
              stroke={frameColor}
              strokeOpacity={upperActive ? 0 : 0.25}
              strokeWidth={0.8}
            />
            {Array.from({ length: 4 }, (_, index) => {
              const active = index < lowerActive;
              return (
                <rect
                  key={index}
                  x={beadX(center)}
                  y={lowerY(index, lowerActive)}
                  width={ABACUS.beadWidth}
                  height={ABACUS.beadHeight}
                  rx={ABACUS.beadHeight / 2}
                  fill={active ? beadColor : idleColor}
                  stroke={frameColor}
                  strokeOpacity={active ? 0 : 0.25}
                  strokeWidth={0.8}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
