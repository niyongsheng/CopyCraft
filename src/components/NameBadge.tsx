import { fontStack } from '../lib/fonts';
import { pinyinOf } from '../lib/pinyin';
import type { SheetSettings } from '../types';

export function NameBadge({ name, settings }: { name: string; settings: SheetSettings }) {
  const chars = Array.from(name).filter((c) => c.trim());
  if (chars.length === 0) return null;
  return (
    <div className="name-badge" style={{ borderColor: settings.borderColor }}>
      <div className="name-badge-pinyin">
        {chars.map((c) => pinyinOf(c) || c).join(' ')}
      </div>
      <div
        className="name-badge-chars"
        style={{
          fontFamily: fontStack(settings.fontId),
          color: settings.inkColor,
        }}
      >
        {chars.join('')}
      </div>
    </div>
  );
}
