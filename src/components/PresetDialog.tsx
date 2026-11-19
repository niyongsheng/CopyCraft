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
import { track } from '../lib/analytics';
import { SHEET_BY_ID } from '../lib/constants';
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

const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: 'all', label: '全部', hint: '所有可用模板' },
  ...PRESET_CATEGORIES,
];

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function PresetDialog() {
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
          : [SHEET_BY_ID[preset.type].label]),
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
  }, [filter, grade, query]);

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
            <span className="settings-eyebrow">模板库</span>
            <h2 id="preset-title">
              <LibraryBig size={18} /> 课本同步与练习模板
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setPresetOpen(false)}
            title="关闭"
            aria-label="关闭模板库"
          >
            <X size={16} />
          </button>
        </header>

        <div className="preset-toolbar">
          <div className="preset-tabs" role="tablist" aria-label="模板分类">
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
                title={item.hint}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="preset-search">
            <Search size={13} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索年级、单元或偏旁…"
              aria-label="搜索模板"
            />
          </label>
        </div>

        <div className="preset-body">
          {availableGrades.length > 0 && (
            <div className="preset-grade-row" role="group" aria-label="按年级筛选">
              <button
                type="button"
                className={`preset-grade ${grade === 'all' ? 'is-active' : ''}`}
                onClick={() => setGrade('all')}
              >
                全部年级
              </button>
              {availableGrades.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`preset-grade ${grade === item ? 'is-active' : ''}`}
                  onClick={() => setGrade(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          <div className="preset-category-hint">
            <Sparkles size={12} />
            {activeFilter.hint} · 共 {presets.length} 个模板
          </div>

          {presets.length === 0 ? (
            <div className="preset-empty">没有匹配的模板，换个关键词试试。</div>
          ) : (
            <div className="preset-grid">
              {presets.map((preset) => {
                const workbook = isWorkbookPreset(preset);
                const typeLabel = workbook
                  ? `${preset.sections.length} 张字帖`
                  : SHEET_BY_ID[preset.type].label;
                return (
                  <article className="preset-card" key={preset.id}>
                    <div className="preset-card-top">
                      <span className="preset-badge">{preset.badge ?? activeFilter.label}</span>
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
                        {workbook ? '生成练习册' : '套用模板'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void onCopy(preset)}
                        title="复制分享链接"
                      >
                        {copiedId === preset.id ? <Check size={13} /> : <Copy size={13} />}
                        {copiedId === preset.id ? '已复制' : '分享链接'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="preset-footer">
          <span>套用模板会覆盖对应字帖的内容与版式；分享链接只包含模板 ID。</span>
          <span>{SHEET_PRESETS.length + WORKBOOK_PRESETS.length} 个内置模板</span>
        </footer>
      </div>
    </div>
  );
}
