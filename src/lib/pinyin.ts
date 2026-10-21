import { pinyin } from 'pinyin-pro';

const cache = new Map<string, string>();
const HAN = /^\p{Script=Han}$/u;

/** Tone-marked pinyin for a single Han character (empty for punctuation/latin). */
export function pinyinOf(char: string): string {
  if (!HAN.test(char)) return '';
  const hit = cache.get(char);
  if (hit !== undefined) return hit;
  let value = '';
  try {
    const res = pinyin(char, { toneType: 'symbol', type: 'array' });
    value = Array.isArray(res) ? (res[0] ?? '') : String(res);
  } catch {
    value = '';
  }
  cache.set(char, value);
  return value;
}

export function isHan(char: string): boolean {
  return HAN.test(char);
}

/** Split text into display units (code points, not UTF-16 halves). */
export function chars(text: string): string[] {
  return Array.from(text);
}

/** Distinct Han characters in a text, in first-appearance order. */
export function uniqueHanChars(text: string): string[] {
  return Array.from(new Set(chars(text).filter(isHan)));
}
