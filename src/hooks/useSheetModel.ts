import { useMemo } from 'react';
import { textKeyFor } from '../lib/constants';
import { buildSheetModel } from '../lib/model';
import { uniqueHanChars } from '../lib/pinyin';
import { useApp } from '../store/useApp';
import { useNameStrokeData } from './useNameStrokeData';

export function useSheetModel() {
  const activeType = useApp((s) => s.activeType);
  const settings = useApp((s) => s.settingsByType[s.activeType]);
  const seed = useApp((s) => s.seed);
  const contentKey = textKeyFor(activeType);
  const content = useApp((s) => (contentKey ? s.contents[contentKey] : ''));

  const nameChars = useMemo(
    () => (activeType === 'name' ? uniqueHanChars(content) : []),
    [activeType, content],
  );

  const stroke = useNameStrokeData(
    nameChars,
    activeType === 'name' && settings.nameStrokeOrder,
  );

  const model = useMemo(
    () => buildSheetModel(activeType, settings, content, seed, stroke.data),
    [activeType, settings, content, seed, stroke.data],
  );

  return { model, stroke };
}
