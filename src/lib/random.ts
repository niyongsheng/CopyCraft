/** Small deterministic PRNG so a sheet only changes when the user asks. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export const int = (rng: Rng, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

export const pick = <T,>(rng: Rng, list: readonly T[]): T =>
  list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/**
 * Collect `count` unique items, retrying until `guardCap` attempts are reached.
 * `make` returns null when a candidate is unusable (e.g. violates a constraint).
 * Ids are assigned in insertion order.
 */
export function collectUnique<T extends { id: number }>(
  count: number,
  guardCap: number,
  make: () => T | null,
  keyOf: (item: T) => string,
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < guardCap) {
    guard += 1;
    const item = make();
    if (!item) continue;
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, id: out.length + 1 });
  }
  return out;
}
