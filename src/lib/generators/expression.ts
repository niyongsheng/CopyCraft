import type { SheetSettings } from '../../types';
import { collectUnique, int, mulberry32, pick } from '../random';

export interface ExpressionProblemData {
  id: number;
  expression: string;
  answer: number;
}

type Op = '+' | '−' | '×' | '÷';

function operationsFor(mode: SheetSettings['expressionOperation']): Op[] {
  if (mode === 'addSub') return ['+', '−'];
  if (mode === 'mulDiv') return ['×', '÷'];
  return ['+', '−', '×', '÷'];
}

function divisorsOf(value: number): number[] {
  const out: number[] = [];
  for (let n = 2; n <= 9; n += 1) {
    if (value % n === 0) out.push(n);
  }
  return out;
}

function combine(current: { text: string; value: number }, op: Op, next: number): {
  text: string;
  value: number;
} | null {
  if (op === '+') {
    return { text: `${current.text} + ${next}`, value: current.value + next };
  }
  if (op === '−') {
    if (current.value < next) return null;
    return { text: `${current.text} − ${next}`, value: current.value - next };
  }
  if (op === '×') {
    const value = current.value * next;
    if (value > 9999) return null;
    return { text: `${current.text} × ${next}`, value };
  }
  if (current.value % next !== 0) return null;
  return { text: `${current.text} ÷ ${next}`, value: current.value / next };
}

export function generateExpression(settings: SheetSettings, seed: number): ExpressionProblemData[] {
  const rng = mulberry32(seed + 6101);
  const count = Math.max(1, Math.min(60, settings.count));
  const range = Math.max(2, Math.min(99, settings.mathRange));
  const steps = settings.expressionSteps === 3 ? 3 : 2;
  const operations = operationsFor(settings.expressionOperation);
  const mixed = settings.expressionOperation === 'mixed';

  return collectUnique(
    count,
    12000,
    () => {
      let current = { text: String(int(rng, 1, range)), value: 0 };
      current.value = Number(current.text);

      for (let step = 0; step < steps; step += 1) {
        const op = pick(rng, operations);
        let next: number;
        if (op === '÷') {
          const divisors = divisorsOf(current.value);
          if (divisors.length === 0) return null;
          next = pick(rng, divisors);
        } else if (op === '×') {
          next = int(rng, 2, 9);
        } else {
          next = int(rng, 1, range);
        }

        const combined = combine(current, op, next);
        if (!combined) return null;

        // 混合运算不加括号会产生歧义，因此始终给左侧复合式加括号。
        if ((mixed || settings.expressionParentheses) && step > 0) {
          combined.text = `(${current.text}) ${op} ${next}`;
        }
        current = combined;
      }

      return { id: 0, expression: current.text, answer: current.value };
    },
    (p) => p.expression,
  );
}
