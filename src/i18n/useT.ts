import { useCallback } from 'react';
import { useApp } from '../store/useApp';
import { translate, type I18nKey, type Vars } from './index';

/** Translate UI strings, re-rendering when the language changes. */
export function useT() {
  const language = useApp((s) => s.language);
  return useCallback(
    (key: I18nKey, vars?: Vars) => translate(language, key, vars),
    [language],
  );
}
