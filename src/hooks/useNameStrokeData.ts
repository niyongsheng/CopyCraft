import { useEffect, useMemo, useState } from 'react';
import { getCachedCharData, loadCharData, type CharData } from '../lib/hanziData';

interface StrokeDataState {
  data: Record<string, CharData>;
  loading: boolean;
  error: string | null;
}

const EMPTY: StrokeDataState = { data: {}, loading: false, error: null };

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
      setState(EMPTY);
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

    setState({ data, loading: missing.length > 0, error: null });
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
