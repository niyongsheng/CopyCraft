import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  Github,
  Heart,
  Info,
  KeyRound,
  Languages,
  Loader2,
  Moon,
  Palette,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { LicenseDialog } from './LicenseDialog';
import { PrivacyDialog } from './PrivacyDialog';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { LANGUAGES } from '../i18n';
import { useT } from '../i18n/useT';
import {
  applyAnalyticsState,
  getWebAnalyticsState,
  setWebAnalyticsEnabled,
} from '../lib/analytics';
import { copyText } from '../lib/clipboard';
import { formatFingerprint, formatLicenseDate } from '../lib/license';
import { isDesktop } from '../lib/platform';
import { REPO_URL } from '../lib/updates';
import { APP_VERSION } from '../lib/version';
import { useApp } from '../store/useApp';
import {
  selectTrialBlocked,
  selectTrialRemainingCount,
  selectTrialRemainingDays,
  useLicense,
} from '../store/useLicense';
import type { ThemeMode } from '../types';
import type { I18nKey } from '../i18n';

const THEME_OPTIONS: {
  id: ThemeMode;
  labelKey: I18nKey;
  hintKey: I18nKey;
  icon: typeof Sun;
}[] = [
  { id: 'light', labelKey: 'settings.themeLight', hintKey: 'settings.themeLightHint', icon: Sun },
  { id: 'dark', labelKey: 'settings.themeDark', hintKey: 'settings.themeDarkHint', icon: Moon },
];

export function SettingsDialog() {
  const t = useT();
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const language = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const setSettingsOpen = useApp((s) => s.setSettingsOpen);
  const { state: update, checking, check, openRelease } = useUpdateCheck();

  const desktop = isDesktop();
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
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // 弹窗挂载即打开：每次打开都向主进程刷新一次权威状态。
  useEffect(() => {
    if (desktop) void refreshLicense();
  }, [desktop, refreshLicense]);

  useEffect(() => {
    if (!desktop) {
      const state = getWebAnalyticsState();
      setAnalyticsEnabled(state.enabled);
      applyAnalyticsState(state);
      return;
    }
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
    if (analyticsSaving) return;
    const previous = analyticsEnabled;
    setAnalyticsEnabled(value);
    setAnalyticsSaving(true);
    try {
      if (!desktop) {
        const state = await setWebAnalyticsEnabled(value);
        setAnalyticsEnabled(state.enabled);
        applyAnalyticsState(state);
        return;
      }
      const bridge = window.desktop;
      if (!bridge?.isElectron) return;
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
    if (await copyText(licenseStatus.machineFingerprint)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      setLicenseMessage({ tone: 'error', text: t('license.copyFailed') });
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
        setLicenseMessage({ tone: 'ok', text: t('license.activateSuccess') });
      } else {
        setLicenseMessage({
          tone: 'error',
          text: result.error ?? t('license.activateFailed'),
        });
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
        title: t('license.webTitle'),
        detail: t('license.webDetail', { days: licenseStatus?.trialDays ?? 14 }),
      };
    }
    if (licenseLoading && !licenseStatus) {
      return {
        tone: 'loading',
        icon: Loader2,
        title: t('license.loadingTitle'),
        detail: '',
      };
    }
    if (!licenseStatus) {
      return {
        tone: 'error',
        icon: AlertTriangle,
        title: t('license.errorTitle'),
        detail: licenseError ?? t('license.errorFallback'),
      };
    }
    if (licenseStatus.activated) {
      return {
        tone: 'active',
        icon: CheckCircle2,
        title: t('license.activeTitle'),
        detail: t('license.activeDetail'),
      };
    }
    if (trialBlocked) {
      return {
        tone: 'blocked',
        icon: AlertTriangle,
        title: t('license.blockedTitle'),
        detail: t('license.blockedDetail'),
      };
    }
    const until = formatLicenseDate(licenseStatus.trialExpiresAt);
    return {
      tone: 'trial',
      icon: KeyRound,
      title: t('license.trialTitle', { count: remainingCount }),
      detail: `${until ? t('license.trialUntil', { date: until }) : ''}${t(
        'license.trialDetail',
        { days: remainingDays },
      )}`,
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
            <span className="settings-eyebrow">{t('settings.eyebrow')}</span>
            <h2 id="settings-title">{t('settings.title')}</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettingsOpen(false)}
            title={t('common.close')}
            aria-label={t('settings.closeLabel')}
          >
            <X size={16} />
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <div className="settings-section-head">
              <Languages size={14} />
              {t('settings.language')}
            </div>
            <div
              className="language-options"
              role="radiogroup"
              aria-label={t('settings.language')}
            >
              {LANGUAGES.map((item) => {
                const active = language === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`language-option ${active ? 'is-active' : ''}`}
                    onClick={() => setLanguage(item.id)}
                  >
                    {item.label}
                    {active && <Check size={13} className="language-check" />}
                  </button>
                );
              })}
            </div>
            <p className="settings-hint">{t('settings.languageHint')}</p>
          </section>

          <section className="settings-section">
            <div className="settings-section-head">
              <Palette size={14} />
              {t('settings.appearance')}
            </div>
            <div
              className="theme-options"
              role="radiogroup"
              aria-label={t('settings.themeAria')}
            >
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
                        {t(option.labelKey)}
                        {active && <Check size={13} className="theme-check" />}
                      </span>
                      <span className="theme-option-hint">{t(option.hintKey)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="settings-hint">{t('settings.themeNote')}</p>
          </section>

          {desktop && (
            <section className="settings-section">
              <div className="settings-section-head">
                <KeyRound size={14} />
                {t('settings.activation')}
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
                    <span className="license-fp-label">{t('license.fingerprint')}</span>
                    <div className="license-fp-row">
                      <code className="license-fp-code">
                        {formatFingerprint(licenseStatus.machineFingerprint)}
                      </code>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void copyFingerprint()}
                        title={t('license.copyFingerprint')}
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                    <p className="license-hint">
                      <a
                        className="license-link"
                        href="https://ifdian.net/a/nico2026"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('license.activationCode')}
                      </a>
                      {t('license.localOnly')}
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
                        aria-label={t('license.codeAria')}
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
                        {activating ? t('license.activating') : t('license.activate')}
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
            </section>
          )}

          <section className="settings-section">
            <div className="settings-section-head">
              <BarChart3 size={14} />
              {t('settings.privacy')}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analyticsEnabled ?? true}
              className={`settings-switch ${analyticsEnabled ? 'is-on' : ''}`}
              onClick={() => void toggleAnalytics(!(analyticsEnabled ?? true))}
              disabled={analyticsEnabled === null || analyticsSaving}
            >
              <span className="settings-switch-text">
                <strong>{t('settings.analytics')}</strong>
                <small>
                  {desktop
                    ? t('settings.analyticsDesktopHint')
                    : t('settings.analyticsWebHint')}
                </small>
              </span>
              <span className="settings-switch-track" aria-hidden="true">
                <span className="settings-switch-thumb" />
              </span>
            </button>
            {desktop && <p className="settings-hint">{t('settings.analyticsNote')}</p>}
            <button
              type="button"
              className="text-button"
              onClick={() => setPrivacyOpen(true)}
            >
              {t('settings.viewPrivacy')}
            </button>
          </section>

          {!desktop && (
            <section className="settings-section">
              <div className="settings-section-head">
                <Heart size={14} />
                {t('settings.support')}
              </div>
              <div className="support-card">
                <div className="support-meta">
                  <div className="support-title">{t('settings.supportTitle')}</div>
                  <div className="support-desc">{t('settings.supportDesc')}</div>
                </div>
                <a
                  className="support-afdian"
                  href="https://ifdian.net/a/nico2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('settings.afdianTitle')}
                >
                  <span className="support-afdian-main">
                    <Heart size={12} /> {t('settings.afdian')}
                  </span>
                  <span className="support-afdian-brand">AFDIAN</span>
                </a>
              </div>
            </section>
          )}

          <section className="settings-section">
            <div className="settings-section-head">
              <Info size={14} />
              {t('settings.about')}
            </div>
            <div className="about-card">
              <div className="about-meta">
                <div className="about-name">{t('app.name')}</div>
                <div className="about-version">
                  {t('settings.version', {
                    version: APP_VERSION,
                    edition: desktop
                      ? t('settings.desktopEdition')
                      : t('settings.webEdition'),
                  })}
                </div>
              </div>
              <div className="about-actions">
                <button
                  type="button"
                  className="btn btn-ghost about-license"
                  onClick={() => setLicenseOpen(true)}
                  title={t('settings.licenseTitle')}
                >
                  <Scale size={13} />
                  {t('settings.mitLicense')}
                </button>
                <a
                  className="btn btn-ghost about-github"
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('settings.githubTitle')}
                >
                  <Github size={13} />
                  GitHub
                </a>
                {desktop && (
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
                    {checking ? t('settings.checking') : t('settings.checkUpdates')}
                  </button>
                )}
              </div>
            </div>

            {desktop && (
              <>
                {update.phase === 'available' && (
                  <button type="button" className="update-banner" onClick={openRelease}>
                    <span>
                      <strong>
                        {t('settings.updateAvailable', { version: update.latest ?? '' })}
                      </strong>
                      <small>{t('settings.updateHint')}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                )}
                {update.phase === 'latest' && (
                  <div className="update-note is-ok">
                    <Check size={13} />{' '}
                    {t('settings.upToDate', { version: APP_VERSION })}
                  </div>
                )}
                {update.phase === 'error' && (
                  <div className="update-note is-error">
                    <Info size={13} />{' '}
                    {t('settings.updateFailed', {
                      error: update.message ?? t('common.unknownError'),
                    })}
                  </div>
                )}
              </>
            )}

            <p className="settings-hint">
              <ShieldCheck size={12} /> {t('settings.localNote')}
            </p>
          </section>
        </div>
      </div>
      {licenseOpen && <LicenseDialog onClose={() => setLicenseOpen(false)} />}
      {privacyOpen && <PrivacyDialog onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
