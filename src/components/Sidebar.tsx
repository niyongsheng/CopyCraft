import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  BookOpen,
  Calculator,
  CaseUpper,
  Clock3,
  Divide,
  Equal,
  Hash,
  Languages,
  LibraryBig,
  PenLine,
  Pilcrow,
  Plus,
  Rows3,
  Scale,
  ScrollText,
  Search,
  Sigma,
  Spline,
  Square,
  Type,
  UserRound,
  Waves,
  X,
} from 'lucide-react';
import {
  GROUP_LABEL_KEYS,
  SHEET_LABEL_KEYS,
  TOOL_LABEL_KEYS,
} from '../i18n';
import { useT } from '../i18n/useT';
import { SHEETS, TOOLS } from '../lib/constants';
import { APP_VERSION } from '../lib/version';
import { useApp } from '../store/useApp';
import type { SheetGroup, SheetType, ToolType } from '../types';
import { LicenseDialog } from './LicenseDialog';

const GROUP_ORDER: SheetGroup[] = ['常用', '英文', '数学', '工具'];

const SHEET_ICONS: Record<SheetType, LucideIcon> = {
  name: UserRound,
  hanzi: PenLine,
  hanziWords: BookOpen,
  hanziParagraph: AlignLeft,
  pinyin: Languages,
  stroke: Spline,
  penControl: Waves,
  number: Hash,
  englishLetter: CaseUpper,
  englishParagraph: Pilcrow,
  compare: Scale,
  addSub: Plus,
  mixed: Sigma,
  division: Divide,
  multiplication: X,
  vertical: Rows3,
  expression: Equal,
  abacus: Calculator,
  clock: Clock3,
  dictation: Type,
  englishWords: CaseUpper,
  poem: ScrollText,
  blank: Square,
};

const TOOL_ICONS: Record<ToolType, LucideIcon> = {
  strokeQuery: Search,
};

export function Sidebar({ open }: { open: boolean }) {
  const t = useT();
  const activeType = useApp((s) => s.activeType);
  const activeTool = useApp((s) => s.activeTool);
  const workbook = useApp((s) => s.workbook);
  const setActiveType = useApp((s) => s.setActiveType);
  const openTool = useApp((s) => s.openTool);
  const setPresetOpen = useApp((s) => s.setPresetOpen);
  const [licenseOpen, setLicenseOpen] = useState(false);

  return (
    <aside
      className={`sidebar ${open ? 'is-open' : 'is-closed'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="sidebar-scroll">
        <div className="sidebar-intro">
          <div className="sidebar-intro-eyebrow">
            <span className="status-dot" />
            {t('sidebar.workbench')}
          </div>
          <div className="sidebar-intro-title">{t('sidebar.introTitle')}</div>
          <div className="sidebar-intro-sub">{t('sidebar.introSub')}</div>
          <button
            type="button"
            className="sidebar-preset"
            onClick={() => setPresetOpen(true)}
          >
            <LibraryBig size={14} />
            {t('sidebar.presetLibrary')}
          </button>
        </div>

        {GROUP_ORDER.map((group) => {
          const sheets = SHEETS.filter((sheet) => sheet.group === group);
          const tools = TOOLS.filter((tool) => tool.group === group);
          if (sheets.length === 0 && tools.length === 0) return null;
          const groupLabel = t(GROUP_LABEL_KEYS[group]);
          return (
            <div className="sheet-group" key={group}>
              <div className="sidebar-label">{groupLabel}</div>
              <nav
                className="sheet-list"
                aria-label={t('sidebar.groupAria', { group: groupLabel })}
              >
                {sheets.map((sheet) => {
                  const Icon = SHEET_ICONS[sheet.id];
                  const active = !activeTool && !workbook && activeType === sheet.id;
                  return (
                    <button
                      type="button"
                      key={sheet.id}
                      className={`sheet-item ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setActiveType(sheet.id)}
                    >
                      <span className="sheet-item-icon">
                        <Icon size={15} strokeWidth={1.9} />
                      </span>
                      <span className="sheet-item-label">
                        {t(SHEET_LABEL_KEYS[sheet.id])}
                      </span>
                    </button>
                  );
                })}
                {tools.map((tool) => {
                  const Icon = TOOL_ICONS[tool.id];
                  const active = activeTool === tool.id;
                  return (
                    <button
                      type="button"
                      key={tool.id}
                      className={`sheet-item ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => openTool(tool.id)}
                    >
                      <span className="sheet-item-icon">
                        <Icon size={15} strokeWidth={1.9} />
                      </span>
                      <span className="sheet-item-label">
                        {t(TOOL_LABEL_KEYS[tool.id])}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-version" title={t('sidebar.versionTitle')}>
          v{APP_VERSION}
        </span>
        <button
          type="button"
          className="sidebar-license"
          onClick={() => setLicenseOpen(true)}
          title={t('sidebar.licenseTitle')}
        >
          MIT
        </button>
      </div>
      {licenseOpen && <LicenseDialog onClose={() => setLicenseOpen(false)} />}
    </aside>
  );
}
