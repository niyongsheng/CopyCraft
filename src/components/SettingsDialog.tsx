import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  Info,
  KeyRound,
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
import { applyAnalyticsState } from '../lib/analytics';
import { formatFingerprint, formatLicenseDate } from '../lib/license';
import { APP_VERSION } from '../lib/version';
import { useApp } from '../store/useApp';
import {
  selectTrialBlocked,
  selectTrialRemainingCount,
  selectTrialRemainingDays,
  useLicense,
} from '../store/useLicense';
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

  const desktop = Boolean(window.desktop?.isElectron);
  const licenseStatus = useLicense((s) => s.status);
  const licenseError = useLicense((s) => s.error);
  const licenseLoading = useLicense((s) => s.loading);
  const refreshLicense = useLicense((s) => s.refresh);
  const activateLicense = useLicense((s) => s.activate);
  const remainingCount = useLicense(selectTrialRemainingCount);
  const remainingDays = useLicense(selectTrialRemainingDays);
  const trialBlocked = useLicense(selectTrialBlocked);
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState<{
    tone: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean | null>(null);
  const [analyticsSaving, setAnalyticsSaving] = useState(false);

  // 弹窗挂载即打开：每次打开都向主进程刷新一次权威状态。
  useEffect(() => {
    if (desktop) void refreshLicense();
  }, [desktop, refreshLicense]);

  useEffect(() => {
    if (!desktop) return;
    let cancelled = false;
    void window.desktop
      ?.analyticsState()
      .then((state) => {
        if (cancelled) return;
        setAnalyticsEnabled(state.enabled);
        applyAnalyticsState(state);
      })
      .catch(() => {
        if (!cancelled) setAnalyticsEnabled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [desktop]);

  const toggleAnalytics = async (value: boolean) => {
    const bridge = window.desktop;
    if (!bridge?.isElectron || analyticsSaving) return;
    const previous = analyticsEnabled;
    setAnalyticsEnabled(value);
    setAnalyticsSaving(true);
    try {
      const state = await bridge.setAnalyticsEnabled(value);
      setAnalyticsEnabled(state.enabled);
      applyAnalyticsState(state);
    } catch {
      setAnalyticsEnabled(previous ?? true);
    } finally {
      setAnalyticsSaving(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSettingsOpen]);

  const copyFingerprint = async () => {
    if (!licenseStatus) return;
    try {
      await navigator.clipboard.writeText(licenseStatus.machineFingerprint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setLicenseMessage({ tone: 'error', text: '复制失败，请手动选择指纹复制' });
    }
  };

  const onActivate = async () => {
    if (!code.trim() || activating) return;
    setActivating(true);
    setLicenseMessage(null);
    try {
      const result = await activateLicense(code.trim());
      if (result.ok) {
        setCode('');
        setLicenseMessage({ tone: 'ok', text: '激活成功，已解锁无限次导出。' });
      } else {
        setLicenseMessage({ tone: 'error', text: result.error ?? '激活失败' });
      }
    } catch (error) {
      setLicenseMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setActivating(false);
    }
  };

  const licenseView = (() => {
    if (!desktop) {
      return {
        tone: 'web',
        icon: Info,
        title: '网页版无需激活',
        detail: `桌面版提供 ${licenseStatus?.trialDays ?? 14} 天免费试用与 30 次导出额度。`,
      };
    }
    if (licenseLoading && !licenseStatus) {
      return {
        tone: 'loading',
        icon: Loader2,
        title: '正在读取激活状态…',
        detail: '',
      };
    }
    if (!licenseStatus) {
      return {
        tone: 'error',
        icon: AlertTriangle,
        title: '无法读取激活状态',
        detail: licenseError ?? '请重启应用后重试。',
      };
    }
    if (licenseStatus.activated) {
      return {
        tone: 'active',
        icon: CheckCircle2,
        title: '已激活 · 永久有效',
        detail: '感谢支持，导出次数不受限制。',
      };
    }
    if (trialBlocked) {
      return {
        tone: 'blocked',
        icon: AlertTriangle,
        title: '免费试用已结束',
        detail: '激活后解锁无限次导出。',
      };
    }
    const until = formatLicenseDate(licenseStatus.trialExpiresAt);
    return {
      tone: 'trial',
      icon: KeyRound,
      title: `免费试用中 · 剩余 ${remainingCount} 次`,
      detail: `${until ? `试用期至 ${until} · ` : ''}剩余 ${remainingDays} 天，激活后永久无限使用。`,
    };
  })();

  const LicenseIcon = licenseView.icon;

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
              <KeyRound size={14} />
              激活
            </div>

            <div className={`license-status is-${licenseView.tone}`}>
              <LicenseIcon
                size={15}
                className={licenseView.tone === 'loading' ? 'spin' : undefined}
              />
              <div className="license-status-text">
                <strong>{licenseView.title}</strong>
                {licenseView.detail && <span>{licenseView.detail}</span>}
              </div>
            </div>

            {desktop && licenseStatus && (
              <>
                <div className="license-fp">
                  <span className="license-fp-label">机器指纹</span>
                  <div className="license-fp-row">
                    <code className="license-fp-code">
                      {formatFingerprint(licenseStatus.machineFingerprint)}
                    </code>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void copyFingerprint()}
                      title="复制机器指纹"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>
                  <p className="license-hint">
                    将指纹发给开发者获取激活码；激活码仅对本机有效。
                  </p>
                </div>

                {!licenseStatus.activated && (
                  <div className="license-form">
                    <input
                      className="license-input"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void onActivate();
                      }}
                      placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                      aria-label="激活码"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={activating}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void onActivate()}
                      disabled={!code.trim() || activating}
                    >
                      {activating ? (
                        <Loader2 size={13} className="spin" />
                      ) : (
                        <KeyRound size={13} />
                      )}
                      {activating ? '激活中…' : '激活'}
                    </button>
                  </div>
                )}

                {licenseMessage && (
                  <p className={`license-note is-${licenseMessage.tone}`}>
                    {licenseMessage.text}
                  </p>
                )}
              </>
            )}

            {!desktop && (
              <p className="license-hint">
                网页版不受试用限制；机器指纹与离线激活仅在桌面版提供。
              </p>
            )}
          </section>

          <section className="settings-section">
            <div className="settings-section-head">
              <BarChart3 size={14} />
              隐私
            </div>
            {desktop ? (
              <>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsEnabled ?? true}
                  className={`settings-switch ${analyticsEnabled ? 'is-on' : ''}`}
                  onClick={() => void toggleAnalytics(!(analyticsEnabled ?? true))}
                  disabled={analyticsEnabled === null || analyticsSaving}
                >
                  <span className="settings-switch-text">
                    <strong>匿名使用统计</strong>
                    <small>
                      仅上报功能使用与导出结果，不包含字帖内容、姓名、机器指纹或激活码。
                    </small>
                  </span>
                  <span className="settings-switch-track" aria-hidden="true">
                    <span className="settings-switch-thumb" />
                  </span>
                </button>
                <p className="settings-hint">
                  统计通过 Aptabase 匿名发送，可在任何时候关闭。
                </p>
              </>
            ) : (
              <p className="settings-hint">网页版未启用使用统计。</p>
            )}
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
              <ShieldCheck size={12} /> 字帖内容全部在本地生成，不会上传；匿名统计不包含内容与个人信息。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
