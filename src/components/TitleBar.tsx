import {
  Download,
  LibraryBig,
  PanelLeft,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import appIcon from '../assets/app-icon.png';
import { useT } from '../i18n/useT';
import { isDesktop } from '../lib/platform';
import { RELEASES_URL } from '../lib/updates';
import { useApp } from '../store/useApp';

export function TitleBar() {
  const t = useT();
  const showSidebar = useApp((s) => s.showSidebar);
  const showInspector = useApp((s) => s.showInspector);
  const toggleSidebar = useApp((s) => s.toggleSidebar);
  const toggleInspector = useApp((s) => s.toggleInspector);
  const setSettingsOpen = useApp((s) => s.setSettingsOpen);
  const setPresetOpen = useApp((s) => s.setPresetOpen);
  const desktop = isDesktop();

  return (
    <header className="titlebar">
      <div className="brand">
        <img className="brand-mark" src={appIcon} alt="" aria-hidden="true" />
        <span className="brand-name">{t('app.name')}</span>
        <span className="brand-badge">
          {desktop ? t('app.desktop') : t('app.web')}
        </span>
      </div>

      <div className="titlebar-spacer" />

      <div className="titlebar-actions">
        <button
          type="button"
          className={`icon-btn ${showSidebar ? 'is-on' : ''}`}
          title={showSidebar ? t('titlebar.hideSidebar') : t('titlebar.showSidebar')}
          aria-label={t('titlebar.toggleSidebar')}
          onClick={toggleSidebar}
        >
          <PanelLeft size={15} />
        </button>
        <button
          type="button"
          className={`icon-btn ${showInspector ? 'is-on' : ''}`}
          title={showInspector ? t('titlebar.hideInspector') : t('titlebar.showInspector')}
          aria-label={t('titlebar.toggleInspector')}
          onClick={toggleInspector}
        >
          <SlidersHorizontal size={15} />
        </button>
        {desktop ? (
          <button
            type="button"
            className="icon-btn titlebar-preset"
            title={t('titlebar.presetLibrary')}
            aria-label={t('titlebar.openPresetLibrary')}
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
            title={t('titlebar.downloadDesktop')}
            aria-label={t('titlebar.downloadDesktop')}
          >
            <Download size={15} />
          </a>
        )}
        <span className="titlebar-divider" aria-hidden="true" />
        <button
          type="button"
          className="icon-btn"
          title={t('common.settings')}
          aria-label={t('titlebar.openSettings')}
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
