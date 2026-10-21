export interface CharData {
  strokes: string[];
  medians: number[][][];
  radStrokes?: number[];
}

const DATA_HOSTS = [
  'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1',
  'https://fastly.jsdelivr.net/npm/hanzi-writer-data@2.0.1',
  'https://unpkg.com/hanzi-writer-data@2.0.1',
];

const cache = new Map<string, CharData>();
const pending = new Map<string, Promise<CharData>>();

async function fetchCharData(char: string): Promise<CharData> {
  let lastError: unknown;
  for (const host of DATA_HOSTS) {
    try {
      const res = await fetch(`${host}/${encodeURIComponent(char)}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CharData;
      if (!Array.isArray(data.strokes) || data.strokes.length === 0) {
        throw new Error('Invalid stroke data');
      }
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Failed to load stroke data');
}

export function getCachedCharData(char: string): CharData | undefined {
  return cache.get(char);
}

export function loadCharData(char: string): Promise<CharData> {
  const hit = cache.get(char);
  if (hit) return Promise.resolve(hit);
  const inFlight = pending.get(char);
  if (inFlight) return inFlight;

  const request = fetchCharData(char)
    .then((data) => {
      cache.set(char, data);
      pending.delete(char);
      return data;
    })
    .catch((err) => {
      pending.delete(char);
      throw err;
    });

  pending.set(char, request);
  return request;
}
