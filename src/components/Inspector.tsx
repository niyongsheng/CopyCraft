import type { ReactNode } from 'react';
import { FileText, Info, Lightbulb, RotateCcw, ShieldCheck } from 'lucide-react';
import { SHEET_LABEL_KEYS, TOOL_LABEL_KEYS, type I18nKey } from '../i18n';
import { useT } from '../i18n/useT';
import { DEFAULT_CONTENT, SHEET_BY_ID, textKeyFor } from '../lib/constants';
import { useApp } from '../store/useApp';
import type { SheetSettings, TextSheetType, ToolType } from '../types';
import { Section } from './controls';
import {
  InspectorCards,
  inspectorCards,
  type SettingsKey,
  type SettingsValue,
} from './inspectorSchema';

const CONTENT_HINT_KEYS: Record<TextSheetType, I18nKey> = {
  hanzi: 'inspector.hint.hanzi',
  hanziWords: 'inspector.hint.hanziWords',
  hanziParagraph: 'inspector.hint.hanziParagraph',
  name: 'inspector.hint.name',
  pinyin: 'inspector.hint.pinyin',
  stroke: 'inspector.hint.stroke',
  englishLetter: 'inspector.hint.englishLetter',
  englishParagraph: 'inspector.hint.englishParagraph',
  number: 'inspector.hint.number',
  dictation: 'inspector.hint.dictation',
  englishWords: 'inspector.hint.englishWords',
  poem: 'inspector.hint.poem',
};

function Panel({
  open,
  title,
  subtitle,
  onReset,
  children,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onReset?: () => void;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <aside
      className={`inspector ${open ? 'is-open' : 'is-closed'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="inspector-head">
        <div className="inspector-heading">
          <span className="inspector-title">{title}</span>
          <span className="inspector-subtitle">{subtitle}</span>
        </div>
        {onReset && (
          <button
            type="button"
            className="icon-btn"
            onClick={onReset}
            title={t('inspector.resetTitle')}
            aria-label={t('inspector.resetTitle')}
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="inspector-scroll">
        {children}
        <div className="inspector-footer">
          <ShieldCheck size={13} /> {t('inspector.localNotice')}
        </div>
      </div>
    </aside>
  );
}

function SheetInspector({ open }: { open: boolean }) {
  const t = useT();
  const activeType = useApp((s) => s.activeType);
  const meta = SHEET_BY_ID[activeType];
  const settings = useApp((s) => s.settingsByType[activeType]);
  const update = useApp((s) => s.update);
  const setTitle = useApp((s) => s.setTitle);
  const title = useApp((s) => s.titles[activeType]);
  const setContent = useApp((s) => s.setContent);
  const contentKey = textKeyFor(activeType);
  const content = useApp((s) => (contentKey ? s.contents[contentKey] : ''));
  const resetActive = useApp((s) => s.resetActive);

  const onChange = (key: SettingsKey, value: SettingsValue) =>
    update({ [key]: value } as Partial<SheetSettings>);

  const hint = contentKey ? t(CONTENT_HINT_KEYS[contentKey]) : '';

  return (
    <Panel
      open={open}
      title={t(SHEET_LABEL_KEYS[meta.id])}
      subtitle={t('inspector.sheetSubtitle')}
      onReset={resetActive}
    >
      {contentKey && (
        <Section label={t('inspector.content')} icon={<FileText size={14} />}>
          <textarea
            className="content-editor"
            value={content}
            spellCheck={false}
            aria-label={t('inspector.contentAria')}
            placeholder={hint}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="editor-meta">
            <span>{hint}</span>
            <span>{t('inspector.charCount', { count: Array.from(content).length })}</span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => setContent(DEFAULT_CONTENT[contentKey])}
          >
            {t('inspector.resetContent')}
          </button>
        </Section>
      )}

      <InspectorCards
        cards={inspectorCards(meta)}
        meta={meta}
        settings={settings}
        onChange={onChange}
        title={title}
        onTitleChange={setTitle}
      />
    </Panel>
  );
}

function WorkbookInspector({ open }: { open: boolean }) {
  const t = useT();
  const workbook = useApp((s) => s.workbook);
  const exitWorkbook = useApp((s) => s.exitWorkbook);
  if (!workbook) return null;

  return (
    <Panel
      open={open}
      title={t('inspector.workbook')}
      subtitle={t('inspector.workbookSubtitle')}
    >
      <Section label={t('inspector.includedSheets')} icon={<FileText size={14} />}>
        <div className="workbook-list">
          {workbook.sections.map((section, index) => {
            const meta = SHEET_BY_ID[section.type];
            return (
              <div className="workbook-row" key={`${section.type}-${index}`}>
                <span className="workbook-row-index">{index + 1}</span>
                <span className="workbook-row-text">
                  <strong>{section.title}</strong>
                  <small>{t(SHEET_LABEL_KEYS[meta.id])}</small>
                </span>
              </div>
            );
          })}
        </div>
        <p className="inspector-note">{t('inspector.workbookNote')}</p>
        <button type="button" className="text-button" onClick={exitWorkbook}>
          {t('inspector.exitWorkbookDesc')}
        </button>
      </Section>
    </Panel>
  );
}

function ToolInspector({ open, tool }: { open: boolean; tool: ToolType }) {
  const t = useT();
  return (
    <Panel
      open={open}
      title={t(TOOL_LABEL_KEYS[tool])}
      subtitle={t('inspector.toolSubtitle')}
    >
      <Section label={t('inspector.description')} icon={<Info size={14} />}>
        <p className="inspector-note">{t('inspector.strokeQueryNote')}</p>
      </Section>
      <Section label={t('inspector.tips')} icon={<Lightbulb size={14} />}>
        <p className="inspector-note">{t('inspector.strokeDataNote')}</p>
      </Section>
    </Panel>
  );
}

export function Inspector({ open }: { open: boolean }) {
  const activeTool = useApp((s) => s.activeTool);
  const workbook = useApp((s) => s.workbook);
  if (activeTool) return <ToolInspector open={open} tool={activeTool} />;
  if (workbook) return <WorkbookInspector open={open} />;
  return <SheetInspector open={open} />;
}
