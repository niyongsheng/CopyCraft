import { useEffect, useMemo, useState } from 'react';
import { getCachedCharData, loadCharData, type CharData } from '../lib/hanziData';

interface StrokeDataState {
  data: Record<string, CharData>;
  loading: boolean;
  error: string | null;
}

const EMPTY: StrokeDataState = { data: {}, loading: false, error: null };

function sameStrokeData(
  a: Record<string, CharData>,
  b: Record<string, CharData>,
): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key] === b[key]);
}

export function useNameStrokeData(chars: string[], enabled: boolean): StrokeDataState {
  const key = useMemo(() => Array.from(new Set(chars.filter(Boolean))).sort().join(''), [chars]);

  const [state, setState] = useState<StrokeDataState>(() => {
    const data: Record<string, CharData> = {};
    for (const char of Array.from(new Set(chars))) {
      const hit = getCachedCharData(char);
      if (hit) data[char] = hit;
    }
    return {
      data,
      loading: enabled && Object.keys(data).length < new Set(chars).size,
      error: null,
    };
  });

  useEffect(() => {
    if (!enabled || key.length === 0) {
      setState((prev) =>
        prev.loading === false &&
        prev.error === null &&
        Object.keys(prev.data).length === 0
          ? prev
          : EMPTY,
      );
      return;
    }

    const unique = Array.from(new Set(key.split('')));
    const data: Record<string, CharData> = {};
    const missing: string[] = [];
    for (const char of unique) {
      const hit = getCachedCharData(char);
      if (hit) data[char] = hit;
      else missing.push(char);
    }

    // The initializer already scanned the cache; keep the same state object
    // so a fully cached name doesn't trigger a redundant model rebuild.
    setState((prev) =>
      prev.loading === (missing.length > 0) &&
      prev.error === null &&
      sameStrokeData(prev.data, data)
        ? prev
        : { data, loading: missing.length > 0, error: null },
    );
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(missing.map(async (char) => [char, await loadCharData(char)] as const))
      .then((entries) => {
        if (cancelled) return;
        setState({
          data: { ...data, ...Object.fromEntries(entries) },
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  return state;
}
