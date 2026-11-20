import {
  Download,
  LibraryBig,
  PanelLeft,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import appIcon from '../assets/app-icon.png';
import { RELEASES_URL } from '../lib/updates';
import { useApp } from '../store/useApp';

export function TitleBar() {
  const showSidebar = useApp((s) => s.showSidebar);
  const showInspector = useApp((s) => s.showInspector);
  const toggleSidebar = useApp((s) => s.toggleSidebar);
  const toggleInspector = useApp((s) => s.toggleInspector);
  const setSettingsOpen = useApp((s) => s.setSettingsOpen);
  const setPresetOpen = useApp((s) => s.setPresetOpen);
  const desktop = Boolean(window.desktop?.isElectron);

  return (
    <header className="titlebar">
      <div className="brand">
        <img className="brand-mark" src={appIcon} alt="" aria-hidden="true" />
        <span className="brand-name">Copycraft</span>
        <span className="brand-sub">字帖工坊</span>
        <span className="brand-badge">{desktop ? 'DESKTOP' : 'WEB'}</span>
      </div>

      <div className="titlebar-spacer" />

      <div className="titlebar-actions">
        <button
          type="button"
          className={`icon-btn ${showSidebar ? 'is-on' : ''}`}
          title={showSidebar ? '隐藏字帖列表' : '显示字帖列表'}
          aria-label="切换字帖列表"
          onClick={toggleSidebar}
        >
          <PanelLeft size={15} />
        </button>
        <button
          type="button"
          className={`icon-btn ${showInspector ? 'is-on' : ''}`}
          title={showInspector ? '隐藏设置面板' : '显示设置面板'}
          aria-label="切换设置面板"
          onClick={toggleInspector}
        >
          <SlidersHorizontal size={15} />
        </button>
        {desktop ? (
          <button
            type="button"
            className="icon-btn titlebar-preset"
            title="模板库 / 课本同步"
            aria-label="打开模板库"
            onClick={() => setPresetOpen(true)}
          >
            <LibraryBig size={15} />
          </button>
        ) : (
          <a
            className="icon-btn titlebar-preset"
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="下载桌面端"
            aria-label="下载桌面端"
          >
            <Download size={15} />
          </a>
        )}
        <span className="titlebar-divider" aria-hidden="true" />
        <button
          type="button"
          className="icon-btn"
          title="设置"
          aria-label="打开设置"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
