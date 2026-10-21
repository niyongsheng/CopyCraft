import type { ClockProblem, SheetSettings } from '../../types';
import { int, mulberry32, pick } from '../random';

export function generateClocks(settings: SheetSettings, seed: number): ClockProblem[] {
  const rng = mulberry32(seed + 7001);
  const count = Math.max(1, Math.min(100, settings.count));
  const minutes = (rng: () => number) => {
    if (settings.clockMinute === '15') return pick(rng, [0, 15, 30, 45]);
    if (settings.clockMinute === '5') return int(rng, 0, 11) * 5;
    return int(rng, 0, 59);
  };
  const maxHour = settings.clock24h ? 24 : 12;
  const out: ClockProblem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < 3000) {
    guard += 1;
    const hour = int(rng, 1, maxHour);
    const minute = minutes(rng);
    const key = `${hour}:${minute}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: out.length + 1, hour, minute });
  }
  return out;
}

export function formatTime(p: ClockProblem, use24h: boolean): string {
  const h = use24h ? p.hour : p.hour % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}
