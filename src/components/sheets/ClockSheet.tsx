import { memo } from 'react';
import { formatTime } from '../../lib/generators/clock';
import type { ClockModel } from '../../lib/model';
import type { SheetSettings } from '../../types';
import { PageFrame } from '../PageFrame';

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = ((i * 6 - 90) * Math.PI) / 180;
  const major = i % 5 === 0;
  const r1 = major ? 41 : 43.6;
  return {
    x1: 50 + Math.cos(a) * r1,
    y1: 50 + Math.sin(a) * r1,
    x2: 50 + Math.cos(a) * 46.4,
    y2: 50 + Math.sin(a) * 46.4,
    w: major ? 0.85 : 0.35,
    o: major ? 0.9 : 0.55,
  };
});

const HOUR_MARKS = Array.from({ length: 12 }, (_, i) => {
  const hour = i === 0 ? 12 : i;
  const a = ((hour * 30 - 90) * Math.PI) / 180;
  return {
    hour,
    x: 50 + Math.cos(a) * 34.5,
    y: 50 + Math.sin(a) * 34.5,
  };
});

const INNER_MARKS = Array.from({ length: 12 }, (_, i) => {
  const hour = 13 + i;
  const a = ((hour * 30 - 90) * Math.PI) / 180;
  return {
    label: String(hour),
    x: 50 + Math.cos(a) * 24.5,
    y: 50 + Math.sin(a) * 24.5,
  };
});

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function roman(hour: number): string {
  return ROMAN[hour % 12];
}

const ClockFace = memo(function ClockFace({
  hour,
  minute,
  size,
  ink,
  face,
  use24h,
  showHands,
}: {
  hour: number;
  minute: number;
  size: number;
  ink: string;
  face: SheetSettings['clockFace'];
  use24h: boolean;
  showHands: boolean;
}) {
  const hourAngle = (((hour % 12) + minute / 60) * 30 - 90) * (Math.PI / 180);
  const minuteAngle = (minute * 6 - 90) * (Math.PI / 180);
  const hand = (angle: number, length: number) => ({
    x: 50 + Math.cos(angle) * length,
    y: 50 + Math.sin(angle) * length,
  });
  const h = hand(hourAngle, 23);
  const m = hand(minuteAngle, 33);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="clock-face"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="47" fill="#fff" stroke={ink} strokeWidth="1.2" />
      {TICKS.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={ink}
          strokeWidth={t.w}
          opacity={t.o}
          strokeLinecap="round"
        />
      ))}
      {face !== 'none' &&
        HOUR_MARKS.map((mark) => (
          <text
            key={mark.hour}
            x={mark.x}
            y={mark.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={
              face === 'roman'
                ? '"Times New Roman", serif'
                : '"Helvetica Neue", Arial, sans-serif'
            }
            fontSize={face === 'roman' ? 5.6 : 7.4}
            fontWeight={500}
            fill={ink}
          >
            {face === 'roman' ? roman(mark.hour) : mark.hour}
          </text>
        ))}
      {use24h &&
        face !== 'none' &&
        INNER_MARKS.map((mark) => (
          <text
            key={mark.label}
            x={mark.x}
            y={mark.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={'"Helvetica Neue", Arial, sans-serif'}
            fontSize={4.4}
            fill={ink}
            opacity={0.62}
          >
            {mark.label}
          </text>
        ))}
      {showHands && (
        <>
          <line
            x1="50"
            y1="50"
            x2={h.x}
            y2={h.y}
            stroke={ink}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="50"
            x2={m.x}
            y2={m.y}
            stroke={ink}
            strokeWidth="1.55"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx="50" cy="50" r="2.1" fill={ink} />
    </svg>
  );
});

export function ClockSheet({
  model,
  settings,
  title,
}: {
  model: ClockModel;
  settings: SheetSettings;
  title: string;
}) {
  const showHands = settings.clockMode === 'read';
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
            className="clock-grid"
            style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }}
          >
            {page.map((problem) => (
              <div
                className="clock-item"
                key={problem.id}
                style={{
                  height: model.rowHeight,
                  transform: `translate(${settings.offsetX * 0.35}px, ${settings.offset * 0.35}px)`,
                }}
              >
                <ClockFace
                  hour={problem.hour}
                  minute={problem.minute}
                  size={model.clockSize}
                  ink={settings.inkColor}
                  face={settings.clockFace}
                  use24h={settings.clock24h}
                  showHands={showHands}
                />
                <div
                  className="clock-label"
                  style={{
                    fontSize: model.labelSize,
                    color: settings.traceColor,
                    minHeight: model.labelSize * 1.6,
                  }}
                >
                  {settings.clockShowTime ? (
                    formatTime(problem, settings.clock24h)
                  ) : (
                    <span className="clock-blank" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </PageFrame>
      ))}
    </>
  );
}
