import type { SheetSettings } from '../../types';
import { int, mulberry32, pick } from '../random';

export interface AbacusProblemData {
  id: number;
  /** 看珠写数 / 看数画珠的目标数。 */
  value?: number;
  /** 心算连算表达式（不含答案）。 */
  expression?: string;
  answer?: number;
}

export function generateAbacus(settings: SheetSettings, seed: number): AbacusProblemData[] {
  const rng = mulberry32(seed + 7319);
  const count = Math.max(1, Math.min(24, settings.count));
  const rods = settings.abacusRods;
  const min = rods === 1 ? 1 : 10 ** (rods - 1);
  const max = 10 ** rods - 1;

  if (settings.abacusMode !== 'calc') {
    const out: AbacusProblemData[] = [];
    const seen = new Set<number>();
    let guard = 0;
    while (out.length < count && guard < 4000) {
      guard += 1;
      const value = int(rng, min, max);
      if (seen.has(value)) continue;
      seen.add(value);
      out.push({ id: out.length + 1, value, answer: value });
    }
    return out;
  }

  const terms = Math.max(2, Math.min(4, settings.abacusTerms));
  const out: AbacusProblemData[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < 8000) {
    guard += 1;
    let current = int(rng, 1, max);
    const parts: (number | string)[] = [current];
    let ok = true;

    for (let i = 1; i < terms; i += 1) {
      const op =
        settings.mathOperation === 'both'
          ? pick(rng, ['+', '−'] as const)
          : settings.mathOperation === 'sub'
            ? '−'
            : '+';

      if (op === '+') {
        const room = max - current;
        if (room <= 0) {
          ok = false;
          break;
        }
        const b = int(rng, 1, Math.min(room, Math.max(1, Math.floor(max / 2))));
        current += b;
        parts.push('+', b);
      } else {
        if (current <= 0) {
          ok = false;
          break;
        }
        const b = int(rng, 1, current);
        current -= b;
        parts.push('−', b);
      }
    }

    if (!ok) continue;
    const expression = `${parts.join(' ')} =`;
    if (seen.has(expression)) continue;
    seen.add(expression);
    out.push({ id: out.length + 1, expression, answer: current });
  }
  return out;
}
