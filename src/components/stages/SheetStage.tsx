import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  FileDown,
  FileType2,
  Loader2,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Scan,
  SlidersHorizontal,
} from 'lucide-react';
import { useSheetModel } from '../../hooks/useSheetModel';
import { SHEET_LABEL_KEYS, type I18nKey } from '../../i18n';
import { useT } from '../../i18n/useT';
import {
  PAGE_WIDTH,
  SHEET_BY_ID,
  defaultSettingsFor,
  isGeneratedSheet,
} from '../../lib/constants';
import { track } from '../../lib/analytics';
import { downloadBlob, exportFileName } from '../../lib/download';
import { buildSheetModel, pageCountOf } from '../../lib/model';
import { isDesktop } from '../../lib/platform';
import { useApp } from '../../store/useApp';
import {
  selectTrialBlocked,
  selectTrialRemainingCount,
  useLicense,
} from '../../store/useLicense';
import { SheetView } from '../sheets/SheetView';

export function SheetStage() {
  const t = useT();
  const activeType = useApp((s) => s.activeType);
  const meta = SHEET_BY_ID[activeType];
  const settings = useApp((s) => s.settingsByType[activeType]);
  const title = useApp((s) => s.titles[activeType]);
  const name = useApp((s) => s.contents.name);
  const seed = useApp((s) => s.seed);
  const shuffle = useApp((s) => s.shuffle);
  const workbook = useApp((s) => s.workbook);
  const exitWorkbook = useApp((s) => s.exitWorkbook);
  const showInspector = useApp((s) => s.showInspector);
  const toggleInspector = useApp((s) => s.toggleInspector);
  const { model, stroke } = useSheetModel();

  const workbookSheets = useMemo(() => {
    if (!workbook) return null;
    return workbook.sections.map((section) => {
      const sectionSettings = {
        ...defaultSettingsFor(section.type),
        ...section.settings,
      };
      return {
        section,
        settings: sectionSettings,
        model: buildSheetModel(section.type, sectionSettings, section.content, seed),
      };
    });
  }, [workbook, seed]);

  const desktopLicense = isDesktop();
  const licenseStatus = useLicense((s) => s.status);
  const trialBlocked = useLicense(selectTrialBlocked);
  const remainingCount = useLicense(selectTrialRemainingCount);
  const refreshLicense = useLicense((s) => s.refresh);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(0.9);
  const [userZoom, setUserZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [toast, setToast] = useState('');
  const [exportKind, setExportKind] = useState<'pdf' | 'docx' | 'print' | null>(null);
  const [exportMenu, setExportMenu] = useState(false);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const update = () => {
      const fitW = (el.clientWidth - 88) / PAGE_WIDTH;
      setFitZoom(Math.max(0.35, Math.min(1.12, fitW)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const zoom = autoFit ? fitZoom : userZoom;
  const pageCount = useMemo(() => {
    if (workbookSheets) {
      return workbookSheets.reduce((sum, item) => sum + pageCountOf(item.model), 0);
    }
    return pageCountOf(model);
  }, [model, workbookSheets]);

  const changeZoom = (delta: number) => {
    setAutoFit(false);
    setUserZoom(Math.max(0.35, Math.min(1.6, zoom + delta)));
  };

  /** 导出前向主进程确认试用 / 激活状态；受限时直接打开设置引导激活。 */
  const ensureCanExport = async (format: 'pdf' | 'docx' | 'print'): Promise<boolean> => {
    if (!isDesktop()) return true;
    try {
      const result = await useLicense.getState().check();
      if (result.allowed) return true;
      track('export', {
        format,
        result: 'blocked',
        reason: result.reason ?? 'unknown',
      });
      setToast(result.error ?? t('toast.trialBlockedExport'));
    } catch (error) {
      track('export', { format, result: 'failed', stage: 'license_check' });
      setToast(
        t('toast.licenseReadFailed', {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    useApp.getState().setSettingsOpen(true);
    return false;
  };

  /** 三种导出共用的结果处理：试用拦截、取消、成功与失败。 */
  const finishExport = (
    result: {
      saved?: boolean;
      printed?: boolean;
      canceled?: boolean;
      needActivation?: boolean;
      error?: string;
    },
    text: {
      blocked: string;
      failure: Extract<I18nKey, 'toast.exportFailed' | 'toast.printFailed'>;
      success: string;
    },
  ) => {
    if (result.needActivation) {
      setToast(result.error ?? text.blocked);
      useApp.getState().setSettingsOpen(true);
      void refreshLicense();
    } else if (result.canceled) {
      setToast('');
    } else if (result.saved || result.printed) {
      setToast(text.success);
      void refreshLicense();
    } else {
      setToast(
        t(text.failure, { error: result.error ?? t('common.unknownError') }),
      );
    }
  };

  const exportPdf = async () => {
    if (exportKind) return;
    if (!(await ensureCanExport('pdf'))) return;
    setExportMenu(false);
    setExportKind('pdf');
    const desktop = window.desktop;
    try {
      if (desktop?.isElectron) {
        setToast(t('toast.generatingPdf'));
        finishExport(await desktop.exportPdf(), {
          blocked: t('toast.trialBlockedExport'),
          failure: 'toast.exportFailed',
          success: t('toast.pdfSaved'),
        });
      } else {
        setToast(t('toast.generatingPdf'));
        const { createPdfFromPages } = await import('../../lib/exportPdf');
        const { blob, pages } = await createPdfFromPages();
        downloadBlob(blob, exportFileName('pdf'));
        track('export', { format: 'pdf', result: 'saved' });
        setToast(t('toast.pdfDownloaded', { count: pages }));
      }
    } catch (error) {
      setToast(
        t('toast.exportFailed', {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      setExportKind(null);
    }
  };

  /** 打印当前字帖：桌面版走主进程打印并计入试用次数，网页版走浏览器打印窗口。 */
  const printSheet = async () => {
    if (exportKind) return;
    setExportMenu(false);

    const desktop = window.desktop;
    if (!desktop?.isElectron) {
      setToast(t('toast.printWebHint'));
      track('print');
      window.print();
      return;
    }

    setExportKind('print');
    try {
      finishExport(await desktop.printSheet(), {
        blocked: t('toast.trialBlockedPrint'),
        failure: 'toast.printFailed',
        success: t('toast.printSent'),
      });
    } catch (error) {
      setToast(
        t('toast.printFailed', {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      setExportKind(null);
    }
  };

  const exportDocx = async () => {
    if (exportKind) return;
    if (!(await ensureCanExport('docx'))) return;
    setExportMenu(false);
    setExportKind('docx');
    setToast(t('toast.wordGenerating'));
    try {
      const { createDocxFromPages } = await import('../../lib/exportDocx');
      const { blob, pages } = await createDocxFromPages();
      const fileName = exportFileName('docx');
      const desktop = window.desktop;
      if (desktop?.isElectron) {
        const data = new Uint8Array(await blob.arrayBuffer());
        finishExport(
          await desktop.saveFile({
            defaultName: fileName,
            filters: [{ name: t('toast.wordFilter'), extensions: ['docx'] }],
            data,
            kind: 'docx',
            pages,
          }),
          {
            blocked: t('toast.trialBlockedExport'),
            failure: 'toast.exportFailed',
            success: t('toast.wordSaved', { count: pages }),
          },
        );
      } else {
        downloadBlob(blob, fileName);
        track('export', { format: 'docx', result: 'saved' });
        setToast(t('toast.wordDownloaded', { count: pages }));
      }
    } catch (error) {
      setToast(
        t('toast.exportFailed', {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      setExportKind(null);
    }
  };

  const sheet = useMemo(() => {
    if (workbookSheets) {
      return workbookSheets.map((item, index) => (
        <SheetView
          key={`${item.section.type}-${index}`}
          type={item.section.type}
          model={item.model}
          settings={item.settings}
          title={item.section.title}
        />
      ));
    }
    return (
      <SheetView
        type={activeType}
        model={model}
        settings={settings}
        title={title}
        name={meta.id === 'name' ? name.split('\n')[0] : undefined}
      />
    );
  }, [workbookSheets, activeType, model, settings, title, name, meta]);

  return (
    <main className="stage">
      <div className="stage-toolbar">
        <div className="stage-title">
          <div className="stage-heading">
            <span className="stage-eyebrow">
              {workbook ? t('stage.workbookPreview') : t('stage.sheetPreview')}
            </span>
            <span className="stage-name">
              {workbook ? workbook.title : t(SHEET_LABEL_KEYS[meta.id])}
            </span>
          </div>
          <div className="stage-chips">
            <span className="meta-chip">A4</span>
            <span className="meta-chip">{t('stage.pageCount', { count: pageCount })}</span>
            {workbook && (
              <span className="meta-chip">
                {t('stage.sheetCount', { count: workbook.sections.length })}
              </span>
            )}
            {desktopLicense && licenseStatus && !licenseStatus.activated && (
              <span
                className={`meta-chip ${trialBlocked ? 'is-warn' : ''}`}
                title={t('stage.trialQuotaTitle')}
              >
                {trialBlocked
                  ? t('stage.trialEnded')
                  : t('stage.trialLeft', { count: remainingCount })}
              </span>
            )}
            {!workbook && meta.id === 'name' && settings.nameStrokeOrder && (
              stroke.loading ? (
                <span className="meta-chip is-warn">
                  <Loader2 size={9} className="spin" /> {t('stage.strokeLoading')}
                </span>
              ) : stroke.error ? (
                <span className="meta-chip is-warn" title={stroke.error}>
                  {t('stage.strokeFailed')}
                </span>
              ) : (
                <span className="meta-chip is-green">{t('stage.strokeOrder')}</span>
              )
            )}
          </div>
        </div>

        <div className="stage-actions">
          {workbook && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={exitWorkbook}
              title={t('stage.exitWorkbookTitle')}
            >
              <ArrowLeft size={14} />
              {t('stage.exitWorkbook')}
            </button>
          )}

          {!workbook && isGeneratedSheet(meta) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={shuffle}
              title={t('stage.shuffleTitle')}
            >
              <RefreshCw size={14} />
              {t('stage.shuffle')}
            </button>
          )}

          <div className="zoom-control">
            <button type="button" aria-label={t('stage.zoomOut')} onClick={() => changeZoom(-0.1)}>
              <Minus size={13} />
            </button>
            <button
              type="button"
              className="zoom-value"
              title={t('stage.fit')}
              onClick={() => setAutoFit(true)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" aria-label={t('stage.zoomIn')} onClick={() => changeZoom(0.1)}>
              <Plus size={13} />
            </button>
            <button
              type="button"
              aria-label={t('stage.fit')}
              title={t('stage.fit')}
              onClick={() => setAutoFit(true)}
            >
              <Scan size={13} />
            </button>
          </div>
          <div className="export-group">
            <button
              type="button"
              className="btn btn-primary export-main"
              onClick={() => void printSheet()}
              disabled={exportKind !== null}
              title={trialBlocked ? t('toast.trialBlockedPrint') : t('stage.printTitle')}
            >
              {exportKind !== null ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Printer size={14} />
              )}
              {exportKind !== null ? t('stage.processing') : t('stage.print')}
            </button>
            <button
              type="button"
              className="btn btn-primary export-caret"
              aria-label={t('stage.exportFormat')}
              aria-haspopup="menu"
              aria-expanded={exportMenu}
              disabled={exportKind !== null}
              onClick={() => setExportMenu((open) => !open)}
            >
              <ChevronDown size={13} />
            </button>
            {exportMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setExportMenu(false)} />
                <div className="export-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => void exportPdf()}>
                    <FileDown size={17} />
                    <span>
                      <strong>{t('stage.downloadPdf')}</strong>
                      <small>
                        {desktopLicense
                          ? t('stage.downloadPdfDesktop')
                          : t('stage.downloadPdfWeb')}
                      </small>
                    </span>
                  </button>
                  <button type="button" role="menuitem" onClick={() => void exportDocx()}>
                    <FileType2 size={17} />
                    <span>
                      <strong>{t('stage.downloadWord')}</strong>
                      <small>{t('stage.downloadWordHint')}</small>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className={`icon-btn stage-inspector-btn ${showInspector ? 'is-on' : ''}`}
            title={t('common.settings')}
            aria-label={t('stage.toggleInspector')}
            onClick={toggleInspector}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <div className="workspace" ref={workspaceRef}>
        <div className="pages" style={{ zoom }}>
          {sheet}
        </div>
      </div>

      {exportKind === 'docx' && (
        <div className="export-overlay">
          <div className="export-overlay-card">
            <Loader2 size={20} className="spin" />
            <div>
              <strong>{t('stage.generatingWord')}</strong>
              <span>{t('stage.renderingPages', { count: pageCount })}</span>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
