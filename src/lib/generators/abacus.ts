import type { SheetSettings } from '../../types';
import { collectUnique, int, mulberry32, pick } from '../random';

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
    return collectUnique(
      count,
      4000,
      () => {
        const value = int(rng, min, max);
        return { id: 0, value, answer: value };
      },
      (p) => String(p.value),
    );
  }

  const terms = Math.max(2, Math.min(4, settings.abacusTerms));

  return collectUnique(
    count,
    8000,
    () => {
      let current = int(rng, 1, max);
      const parts: (number | string)[] = [current];

      for (let i = 1; i < terms; i += 1) {
        const op =
          settings.mathOperation === 'both'
            ? pick(rng, ['+', '−'] as const)
            : settings.mathOperation === 'sub'
              ? '−'
              : '+';

        if (op === '+') {
          const room = max - current;
          if (room <= 0) return null;
          const b = int(rng, 1, Math.min(room, Math.max(1, Math.floor(max / 2))));
          current += b;
          parts.push('+', b);
        } else {
          if (current <= 0) return null;
          const b = int(rng, 1, current);
          current -= b;
          parts.push('−', b);
        }
      }

      return { id: 0, expression: `${parts.join(' ')} =`, answer: current };
    },
    (p) => p.expression ?? '',
  );
}
