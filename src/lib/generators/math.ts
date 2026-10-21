import type { Problem, SheetSettings, SheetType, VerticalProblem } from '../../types';
import { int, mulberry32, pick, type Rng } from '../random';

const BLANK = '___';

export function generateMath(
  type: Extract<SheetType, 'compare' | 'addSub' | 'mixed' | 'division' | 'multiplication'>,
  settings: SheetSettings,
  seed: number,
): Problem[] {
  const count = Math.max(1, Math.min(200, settings.count));
  const range = Math.max(2, Math.min(99, settings.mathRange));
  const rng = mulberry32(seed + type.length * 977);

  const make = (r: Rng): Problem => {
    if (type === 'compare') {
      const a = int(r, 0, range);
      const b = int(r, 0, range);
      return { id: 0, expression: `${a}   ${b}   ${BLANK}`, answer: Math.sign(a - b) };
    }

    if (type === 'multiplication') {
      const max = Math.max(2, Math.min(12, settings.mathRange));
      const a = int(r, 1, max);
      const b = int(r, 1, max);
      return { id: 0, expression: `${a} × ${b} = ${BLANK}`, answer: a * b };
    }

    if (type === 'division') {
      const max = Math.max(2, Math.min(12, settings.mathRange));
      const b = int(r, 2, max);
      const q = int(r, 1, max);
      const a = b * q;
      return { id: 0, expression: `${a} ÷ ${b} = ${BLANK}`, answer: q };
    }

    if (type === 'mixed') {
      const a = int(r, 2, range);
      let b = int(r, 1, range);
      const c = int(r, 1, range);
      if (r() < 0.5) {
        // a + b − c, keeping the intermediate result non-negative
        const safeC = Math.min(c, a + b - 1);
        return {
          id: 0,
          expression: `${a} + ${b} − ${safeC} = ${BLANK}`,
          answer: a + b - safeC,
        };
      }
      // a − b + c, keeping the first step non-negative
      if (b > a) b = a;
      return {
        id: 0,
        expression: `${a} − ${b} + ${c} = ${BLANK}`,
        answer: a - b + c,
      };
    }

    // add / subtract
    const op = settings.mathOperation === 'both' ? pick(r, ['+', '−'] as const) : settings.mathOperation === 'sub' ? '−' : '+';
    let a = int(r, 0, range);
    let b = int(r, 0, range);
    let answer = op === '+' ? a + b : a - b;
    if (op === '−' && b > a) {
      [a, b] = [b, a];
      answer = a - b;
    }
    if (settings.mathMode === 'fill') {
      const c = answer;
      const variant = int(r, 0, 2);
      if (variant === 0) return { id: 0, expression: `${a} ${op} ${BLANK} = ${c}`, answer: b };
      if (variant === 1) return { id: 0, expression: `${BLANK} ${op} ${b} = ${c}`, answer: a };
      return { id: 0, expression: `${a} ${op} ${b} = ${BLANK}`, answer };
    }
    return { id: 0, expression: `${a} ${op} ${b} = ${BLANK}`, answer };
  };

  // add-level uniqueness for tiny ranges that can't fill the requested count
  const out: Problem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < 4000) {
    guard += 1;
    const p = make(rng);
    if (seen.has(p.expression)) continue;
    seen.add(p.expression);
    out.push({ ...p, id: out.length + 1 });
  }
  return out;
}

export function generateVertical(settings: SheetSettings, seed: number): VerticalProblem[] {
  const rng = mulberry32(seed + 4241);
  const count = Math.max(1, Math.min(60, settings.count));
  const out: VerticalProblem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < 4000) {
    guard += 1;
    const op = settings.mathOperation === 'add' ? '+' : settings.mathOperation === 'sub' ? '−' : pick(rng, ['+', '−'] as const);
    let a = int(rng, 10, 99);
    let b = int(rng, 10, 99);
    if (op === '−' && b > a) [a, b] = [b, a];
    const key = `${a}${op}${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: out.length + 1,
      a,
      b,
      op,
      answer: op === '+' ? a + b : a - b,
    });
  }
  return out;
}

