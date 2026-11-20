import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  FileStack,
  LibraryBig,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  GRADE_LABEL_KEYS,
  SHEET_LABEL_KEYS,
  type I18nKey,
} from '../i18n';
import { useT } from '../i18n/useT';
import { track } from '../lib/analytics';
import { copyText } from '../lib/clipboard';
import {
  GRADE_ORDER,
  PRESET_CATEGORIES,
  SHEET_PRESETS,
  WORKBOOK_PRESETS,
  isWorkbookPreset,
  presetShareUrl,
  type Preset,
  type PresetCategory,
} from '../lib/presets';
import { useApp } from '../store/useApp';

type Filter = 'all' | PresetCategory;

const FILTERS: { id: Filter; labelKey: I18nKey; hintKey: I18nKey }[] = [
  { id: 'all', labelKey: 'category.all.label', hintKey: 'category.all.hint' },
  ...PRESET_CATEGORIES,
];

export function PresetDialog() {
  const t = useT();
  const open = useApp((s) => s.presetOpen);
  const setPresetOpen = useApp((s) => s.setPresetOpen);
  const applyPreset = useApp((s) => s.applyPreset);
  const applyWorkbook = useApp((s) => s.applyWorkbook);

  const [filter, setFilter] = useState<Filter>('all');
  const [grade, setGrade] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPresetOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setPresetOpen]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const availableGrades = useMemo(() => {
    if (filter !== 'textbook' && filter !== 'words' && filter !== 'workbook') {
      return [];
    }
    const grades = new Set<string>();
    for (const preset of [...SHEET_PRESETS, ...WORKBOOK_PRESETS]) {
      if (preset.category === filter && preset.grade) grades.add(preset.grade);
    }
    return GRADE_ORDER.filter((item) => grades.has(item));
  }, [filter]);

  const presets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all: Preset[] = [...SHEET_PRESETS, ...WORKBOOK_PRESETS];
    const filtered = all.filter((preset) => {
      if (filter !== 'all' && preset.category !== filter) return false;
      if (
        grade !== 'all' &&
        (!('grade' in preset) || preset.grade !== grade)
      ) {
        return false;
      }
      if (!needle) return true;
      const haystack = [
        preset.title,
        preset.description,
        preset.badge ?? '',
        ...preset.tags,
        ...(isWorkbookPreset(preset)
          ? preset.sections.map((section) => section.title)
          : [t(SHEET_LABEL_KEYS[preset.type])]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });

    if (filter === 'textbook' || filter === 'words' || filter === 'workbook') {
      filtered.sort((a, b) => {
        const gradeA = 'grade' in a && a.grade ? GRADE_ORDER.indexOf(a.grade) : 99;
        const gradeB = 'grade' in b && b.grade ? GRADE_ORDER.indexOf(b.grade) : 99;
        if (gradeA !== gradeB) return gradeA - gradeB;
        const semesterA = 'semester' in a && a.semester === '下册' ? 1 : 0;
        const semesterB = 'semester' in b && b.semester === '下册' ? 1 : 0;
        return semesterA - semesterB;
      });
    }
    return filtered;
  }, [filter, grade, query, t]);

  if (!open) return null;

  const onUse = (preset: Preset) => {
    track('preset_used', { preset: preset.id, category: preset.category });
    if (isWorkbookPreset(preset)) applyWorkbook(preset);
    else applyPreset(preset);
  };

  const onCopy = async (preset: Preset) => {
    const ok = await copyText(presetShareUrl(preset.id));
    if (ok) {
      setCopiedId(preset.id);
      track('preset_shared', { preset: preset.id, category: preset.category });
    }
  };

  const gradeLabel = (item: string) => {
    const key = GRADE_LABEL_KEYS[item];
    return key ? t(key) : item;
  };

  const activeFilter = FILTERS.find((item) => item.id === filter) ?? FILTERS[0];

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setPresetOpen(false);
      }}
    >
      <div
        className="settings-dialog preset-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-title"
      >
        <header className="settings-head">
          <div className="settings-heading">
            <span className="settings-eyebrow">{t('presets.eyebrow')}</span>
            <h2 id="preset-title">
              <LibraryBig size={18} /> {t('presets.title')}
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setPresetOpen(false)}
            title={t('common.close')}
            aria-label={t('presets.closeLabel')}
          >
            <X size={16} />
          </button>
        </header>

        <div className="preset-toolbar">
          <div className="preset-tabs" role="tablist" aria-label={t('presets.tabsAria')}>
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={`preset-tab ${filter === item.id ? 'is-active' : ''}`}
                onClick={() => {
                  setFilter(item.id);
                  setGrade('all');
                }}
                title={t(item.hintKey)}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <label className="preset-search">
            <Search size={13} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('presets.searchPlaceholder')}
              aria-label={t('presets.searchAria')}
            />
          </label>
        </div>

        <div className="preset-body">
          {availableGrades.length > 0 && (
            <div
              className="preset-grade-row"
              role="group"
              aria-label={t('presets.gradeFilterAria')}
            >
              <button
                type="button"
                className={`preset-grade ${grade === 'all' ? 'is-active' : ''}`}
                onClick={() => setGrade('all')}
              >
                {t('presets.allGrades')}
              </button>
              {availableGrades.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`preset-grade ${grade === item ? 'is-active' : ''}`}
                  onClick={() => setGrade(item)}
                >
                  {gradeLabel(item)}
                </button>
              ))}
            </div>
          )}
          <div className="preset-category-hint">
            <Sparkles size={12} />
            {t('presets.summary', {
              hint: t(activeFilter.hintKey),
              count: presets.length,
            })}
          </div>

          {presets.length === 0 ? (
            <div className="preset-empty">{t('presets.empty')}</div>
          ) : (
            <div className="preset-grid">
              {presets.map((preset) => {
                const workbook = isWorkbookPreset(preset);
                const typeLabel = workbook
                  ? t('presets.sheetCount', { count: preset.sections.length })
                  : t(SHEET_LABEL_KEYS[preset.type]);
                return (
                  <article className="preset-card" key={preset.id}>
                    <div className="preset-card-top">
                      <span className="preset-badge">
                        {preset.badge ?? t(activeFilter.labelKey)}
                      </span>
                      <span className="preset-type">
                        {workbook ? <FileStack size={11} /> : null}
                        {typeLabel}
                      </span>
                    </div>
                    <h3>{preset.title}</h3>
                    <p>{preset.description}</p>
                    <div className="preset-tags">
                      {preset.tags.slice(0, 4).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className="preset-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onUse(preset)}
                      >
                        {workbook ? t('presets.generateWorkbook') : t('presets.apply')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void onCopy(preset)}
                        title={t('presets.copyLink')}
                      >
                        {copiedId === preset.id ? <Check size={13} /> : <Copy size={13} />}
                        {copiedId === preset.id ? t('common.copied') : t('presets.share')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="preset-footer">
          <span>{t('presets.footnote')}</span>
          <span>
            {t('presets.builtin', { count: SHEET_PRESETS.length + WORKBOOK_PRESETS.length })}
          </span>
        </footer>
      </div>
    </div>
  );
}
