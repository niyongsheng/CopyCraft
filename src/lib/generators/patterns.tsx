import type { ReactNode } from 'react';

export interface PatternDef {
  id: string;
  name: string;
  render: (color: string) => ReactNode;
}

const g = (color: string, children: ReactNode) => (
  <g
    fill="none"
    stroke={color}
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </g>
);

const star = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const rr = i % 2 === 0 ? r : r * 0.44;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return pts.join(' ');
};

export const PATTERNS: PatternDef[] = [
  {
    id: 'vlines',
    name: '竖线',
    render: (c) => g(c, <path d="M14 10V90 M32 10V90 M50 10V90 M68 10V90 M86 10V90" />),
  },
  {
    id: 'hlines',
    name: '横线',
    render: (c) => g(c, <path d="M10 14H90 M10 32H90 M10 50H90 M10 68H90 M10 86H90" />),
  },
  {
    id: 'diagonal',
    name: '斜线',
    render: (c) => g(c, <path d="M10 90 90 10 M-20 70 50 -20 M50 120 120 50" />),
  },
  {
    id: 'hatch',
    name: '斜线交叉',
    render: (c) => g(c, <path d="M10 90 90 10 M-20 70 50 -20 M50 120 120 50 M10 10 90 90 M-20 30 50 120 M50 -20 120 30" />),
  },
  {
    id: 'circles',
    name: '同心圆',
    render: (c) => g(c, <path d="M60 50a10 10 0 1 1-10-10 20 20 0 1 1 20 20 30 30 0 1 1-30-30 40 40 0 1 1 40 40" />),
  },
  {
    id: 'rounds',
    name: '圆圈',
    render: (c) => (
      <>
        {g(c, <circle cx="30" cy="32" r="15" />)}
        {g(c, <circle cx="68" cy="30" r="12" />)}
        {g(c, <circle cx="34" cy="70" r="12" />)}
        {g(c, <circle cx="70" cy="68" r="16" />)}
      </>
    ),
  },
  {
    id: 'spiral',
    name: '螺旋',
    render: (c) => g(c, <path d="M50 50a3 3 0 1 1 3 3 9 9 0 1 0-9-9 15 15 0 1 1 15 15 21 21 0 1 0-21-21 27 27 0 1 1 27 27 33 33 0 1 0-33-33" />),
  },
  {
    id: 'waves',
    name: '波浪线',
    render: (c) => g(c, <path d="M4 24q11-16 22 0t22 0 22 0 22 0 M4 50q11-16 22 0t22 0 22 0 22 0 M4 76q11-16 22 0t22 0 22 0 22 0" />),
  },
  {
    id: 'zigzag',
    name: '折线',
    render: (c) => g(c, <path d="M6 32 19 20 32 32 45 20 58 32 71 20 84 32 97 20 M6 62 19 50 32 62 45 50 58 62 71 50 84 62 97 50 M6 88 19 76 32 88 45 76 58 88 71 76 84 88 97 76" />),
  },
  {
    id: 'loops',
    name: '连笔圈',
    render: (c) => g(c, <path d="M6 56c0-25 22-25 22 0s22 25 22 0 22-25 22 0 22 25 22 0 M6 86c0-20 18-20 18 0s18 20 18 0 18-20 18 0 18 20 18 0" />),
  },
  {
    id: 'squares',
    name: '方形',
    render: (c) => g(c, <path d="M18 18h64v64H18z M31 31h38v38H31z M44 44h12v12H44z" />),
  },
  {
    id: 'diamonds',
    name: '菱形',
    render: (c) => g(c, <path d="M50 8 68 26 50 44 32 26z M22 56 40 74 22 92 4 74z M78 56 96 74 78 92 60 74z" />),
  },
  {
    id: 'arches',
    name: '拱形',
    render: (c) => g(c, <path d="M4 70a12 12 0 0 1 24 0M30 70a12 12 0 0 1 24 0M56 70a12 12 0 0 1 24 0M82 70a12 12 0 0 1 24 0 M4 36a12 12 0 0 1 24 0M30 36a12 12 0 0 1 24 0M56 36a12 12 0 0 1 24 0M82 36a12 12 0 0 1 24 0" />),
  },
  {
    id: 'ladder',
    name: '梯子',
    render: (c) => g(c, <path d="M28 6v88 M72 6v88 M28 16h44 M28 32h44 M28 48h44 M28 64h44 M28 80h44" />),
  },
  {
    id: 'triangles',
    name: '三角形',
    render: (c) => g(c, <path d="M50 12 68 42H32z M22 56 40 86H4z M78 56 96 86H60z" />),
  },
  {
    id: 'grid',
    name: '网格',
    render: (c) => g(c, <path d="M10 10h80v80H10z M30 10v80 M50 10v80 M70 10v80 M10 30h80 M10 50h80 M10 70h80" />),
  },
  {
    id: 'stars',
    name: '星星',
    render: (c) => (
      <>
        {g(c, <polygon points={star(50, 50, 30)} />)}
        {g(c, <polygon points={star(20, 20, 12)} />)}
        {g(c, <polygon points={star(82, 78, 10)} />)}
      </>
    ),
  },
  {
    id: 'hearts',
    name: '爱心',
    render: (c) => g(c, <path d="M50 78C30 62 20 46 30 34c7-8 18-5 20 4 2-9 13-12 20-4 10 12 0 28-20 44z M20 78c-8-8-12-16-9-22 2-5 9-5 12 0 M82 78c8-8 12-16 9-22-2-5-9-5-12 0" />),
  },
  {
    id: 'sun',
    name: '太阳',
    render: (c) => g(c, <path d="M50 26a20 20 0 1 1 0 40 20 20 0 0 1 0-40z M50 6v10 M50 84v10 M6 50h10 M84 50h10 M19 19l7 7 M74 74l7 7 M81 19l-7 7 M26 74l-7 7" />),
  },
  {
    id: 'maze',
    name: '迷宫',
    render: (c) => g(c, <path d="M14 14h72v28H42v16h32v14H42v14h44" />),
  },
  {
    id: 'scallops',
    name: '云朵',
    render: (c) => g(c, <path d="M14 44a10 10 0 0 1 10-10 12 12 0 0 1 22-4 12 12 0 0 1 18 4 10 10 0 0 1 10 10 10 10 0 0 1-10 10H24a10 10 0 0 1-10-10z M24 76a8 8 0 0 1 8-8 10 10 0 0 1 18-3 10 10 0 0 1 15 3 8 8 0 0 1 8 8 8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z" />),
  },
  {
    id: 'curls',
    name: '卷曲',
    render: (c) => g(c, <path d="M20 76c0-18 14-18 14 0s-14 18-14 0c0-30 24-30 24 0s24 30 24 0 24-30 24 0 M16 34c0-14 12-14 12 0s12 14 12 0 12-14 12 0 12 14 12 0 12-14 12 0 12 14 12 0" />),
  },
  {
    id: 'dots',
    name: '圆点',
    render: (c) => (
      <g fill={c}>
        {[24, 50, 76].map((y) =>
          [14, 36, 58, 80].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} />),
        )}
      </g>
    ),
  },
  {
    id: 'mountains',
    name: '山形',
    render: (c) => g(c, <path d="M2 84 24 36l16 30 14-42 20 56 14-26 10 30" />),
  },
];
