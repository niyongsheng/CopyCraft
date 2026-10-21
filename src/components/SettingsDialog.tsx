import { useEffect } from 'react';
import {
  ArrowUpRight,
  Check,
  Info,
  Loader2,
  Moon,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import appIcon from '../assets/app-icon.png';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { APP_VERSION } from '../lib/version';
import { useApp } from '../store/useApp';
import type { ThemeMode } from '../types';

const THEME_OPTIONS: {
  id: ThemeMode;
  label: string;
  hint: string;
  icon: typeof Sun;
}[] = [
  { id: 'light', label: '明亮', hint: '清爽的浅色界面', icon: Sun },
  { id: 'dark', label: '暗黑', hint: '专注的深色界面', icon: Moon },
];

export function SettingsDialog() {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const setSettingsOpen = useApp((s) => s.setSettingsOpen);
  const { state: update, checking, check, openRelease } = useUpdateCheck();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSettingsOpen]);

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setSettingsOpen(false);
      }}
    >
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <header className="settings-head">
          <div className="settings-heading">
            <span className="settings-eyebrow">偏好设置</span>
            <h2 id="settings-title">设置</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettingsOpen(false)}
            title="关闭"
            aria-label="关闭设置"
          >
            <X size={16} />
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <div className="settings-section-head">
              <Palette size={14} />
              外观
            </div>
            <div className="theme-options" role="radiogroup" aria-label="主题模式">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`theme-option theme-option-${option.id} ${
                      active ? 'is-active' : ''
                    }`}
                    onClick={() => setTheme(option.id)}
                  >
                    <span className="theme-preview" aria-hidden="true">
                      <span className="tp-bar">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="tp-body">
                        <span className="tp-side" />
                        <span className="tp-main">
                          <i />
                          <i />
                          <i />
                        </span>
                      </span>
                    </span>
                    <span className="theme-option-meta">
                      <span className="theme-option-label">
                        <Icon size={13} />
                        {option.label}
                        {active && <Check size={13} className="theme-check" />}
                      </span>
                      <span className="theme-option-hint">{option.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="settings-hint">主题会立即应用，并随其它设置一起保存在本地。</p>
          </section>

          <section className="settings-section">
            <div className="settings-section-head">
              <Info size={14} />
              关于
            </div>
            <div className="about-card">
              <img className="about-icon" src={appIcon} alt="" aria-hidden="true" />
              <div className="about-meta">
                <div className="about-name">Copycraft 字帖工坊</div>
                <div className="about-version">
                  版本 v{APP_VERSION} ·{' '}
                  {window.desktop?.isElectron ? '桌面版' : '网页版'}
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => void check()}
                disabled={checking}
              >
                {checking ? (
                  <Loader2 size={13} className="spin" />
                ) : (
                  <RefreshCw size={13} />
                )}
                {checking ? '检查中…' : '检查更新'}
              </button>
            </div>

            {update.phase === 'available' && (
              <button type="button" className="update-banner" onClick={openRelease}>
                <span>
                  <strong>发现新版本 v{update.latest}</strong>
                  <small>前往 GitHub Releases 下载安装包</small>
                </span>
                <ArrowUpRight size={15} />
              </button>
            )}
            {update.phase === 'latest' && (
              <div className="update-note is-ok">
                <Check size={13} /> 已是最新版本 v{APP_VERSION}
              </div>
            )}
            {update.phase === 'error' && (
              <div className="update-note is-error">
                <Info size={13} /> 检查更新失败：{update.message ?? '未知错误'}
              </div>
            )}

            <p className="settings-hint">
              <ShieldCheck size={12} /> 字帖内容全部在本地生成，不会上传任何数据。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
