import type { LucideIcon } from 'lucide-react';
import {
  AlignLeft,
  CaseUpper,
  Clock3,
  Divide,
  Hash,
  Languages,
  PenLine,
  Pilcrow,
  Plus,
  Rows3,
  Scale,
  Search,
  Sigma,
  Spline,
  UserRound,
  Waves,
  X,
} from 'lucide-react';
import { SHEETS, TOOLS } from '../lib/constants';
import { APP_VERSION } from '../lib/version';
import { useApp } from '../store/useApp';
import type { SheetGroup, SheetType, ToolType } from '../types';

const GROUP_ORDER: SheetGroup[] = ['常用', '英文', '数学', '工具'];

const SHEET_ICONS: Record<SheetType, LucideIcon> = {
  name: UserRound,
  hanzi: PenLine,
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
  clock: Clock3,
};

const TOOL_ICONS: Record<ToolType, LucideIcon> = {
  strokeQuery: Search,
};

export function Sidebar({ open }: { open: boolean }) {
  const activeType = useApp((s) => s.activeType);
  const activeTool = useApp((s) => s.activeTool);
  const setActiveType = useApp((s) => s.setActiveType);
  const openTool = useApp((s) => s.openTool);

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
            工作台
          </div>
          <div className="sidebar-intro-title">开始制作字帖</div>
          <div className="sidebar-intro-sub">选择模板，右侧实时预览</div>
        </div>

        {GROUP_ORDER.map((group) => {
          const sheets = SHEETS.filter((sheet) => sheet.group === group);
          const tools = TOOLS.filter((tool) => tool.group === group);
          if (sheets.length === 0 && tools.length === 0) return null;
          return (
            <div className="sheet-group" key={group}>
              <div className="sidebar-label">{group}</div>
              <nav className="sheet-list" aria-label={`${group}字帖`}>
                {sheets.map((sheet) => {
                  const Icon = SHEET_ICONS[sheet.id];
                  const active = !activeTool && activeType === sheet.id;
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
                      <span className="sheet-item-label">{sheet.label}</span>
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
                      <span className="sheet-item-label">{tool.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-version" title="Copycraft 版本">
          v{APP_VERSION}
        </span>
      </div>
    </aside>
  );
}
