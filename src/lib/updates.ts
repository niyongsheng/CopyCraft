const REPO = 'niyongsheng/Copycraft';

export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `https://github.com/${REPO}/releases`;

export interface UpdateCheckResult {
  current: string;
  latest: string | null;
  url: string;
  hasUpdate: boolean;
}

function parseVersion(version: string): number[] {
  return version
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10) || 0);
}

/** Returns > 0 when `a` is newer than `b`. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function normalizeTag(tag: unknown): string | null {
  if (typeof tag !== 'string') return null;
  const clean = tag.trim().replace(/^v/i, '');
  return /^\d/.test(clean) ? clean : null;
}

export async function checkForUpdates(current: string): Promise<UpdateCheckResult> {
  let latest: string | null = null;
  let url = RELEASES_URL;

  const desktop = window.desktop;
  if (desktop?.checkUpdates) {
    const result = await desktop.checkUpdates();
    if (result.error) throw new Error(result.error);
    latest = normalizeTag(result.latest);
    url = result.url || RELEASES_URL;
  } else {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (response.status !== 404) {
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const data = (await response.json()) as { tag_name?: unknown; html_url?: unknown };
      latest = normalizeTag(data.tag_name);
      if (typeof data.html_url === 'string') url = data.html_url;
    }
  }

  return {
    current,
    latest,
    url,
    hasUpdate: Boolean(latest && compareVersions(latest, current) > 0),
  };
}
