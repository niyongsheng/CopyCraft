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
import {
  PAGE_WIDTH,
  SHEET_BY_ID,
  defaultSettingsFor,
  isGeneratedSheet,
} from '../../lib/constants';
import { track } from '../../lib/analytics';
import { downloadBlob, exportFileName } from '../../lib/download';
import { buildSheetModel } from '../../lib/model';
import { useApp } from '../../store/useApp';
import {
  selectTrialBlocked,
  selectTrialRemainingCount,
  useLicense,
} from '../../store/useLicense';
import { SheetView } from '../sheets/SheetView';

export function SheetStage() {
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

  const desktopLicense = Boolean(window.desktop?.isElectron);
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
      return workbookSheets.reduce(
        (sum, item) =>
          sum +
          (item.model.kind === 'pen' || item.model.kind === 'poem'
            ? 1
            : item.model.pages.length),
        0,
      );
    }
    return model.kind === 'pen' || model.kind === 'poem' ? 1 : model.pages.length;
  }, [model, workbookSheets]);

  const changeZoom = (delta: number) => {
    setAutoFit(false);
    setUserZoom(Math.max(0.35, Math.min(1.6, zoom + delta)));
  };

  /** 导出前向主进程确认试用 / 激活状态；受限时直接打开设置引导激活。 */
  const ensureCanExport = async (format: 'pdf' | 'docx' | 'print'): Promise<boolean> => {
    const desktop = window.desktop;
    if (!desktop?.isElectron) return true;
    try {
      const result = await desktop.licenseCheck();
      if (result.status) useLicense.setState({ status: result.status });
      if (result.allowed) return true;
      track('export', {
        format,
        result: 'blocked',
        reason: result.reason ?? 'unknown',
      });
      setToast(result.error ?? '免费试用已结束，请激活后继续导出');
    } catch (error) {
      track('export', { format, result: 'failed', stage: 'license_check' });
      setToast(
        `无法读取激活状态：${error instanceof Error ? error.message : String(error)}`,
      );
    }
    useApp.getState().setSettingsOpen(true);
    return false;
  };

  const exportPdf = async () => {
    if (exportKind) return;
    if (!(await ensureCanExport('pdf'))) return;
    setExportMenu(false);
    setExportKind('pdf');
    const desktop = window.desktop;
    try {
      if (desktop?.isElectron) {
        setToast('正在生成 PDF…');
        const result = await desktop.exportPdf();
        if (result.needActivation) {
          setToast(result.error ?? '免费试用已结束，请激活后继续导出');
          useApp.getState().setSettingsOpen(true);
          void refreshLicense();
        } else if (result.canceled) {
          setToast('');
        } else if (result.saved) {
          setToast('PDF 导出成功');
          void refreshLicense();
        } else {
          setToast(`导出失败：${result.error ?? '未知错误'}`);
        }
      } else {
        setToast('正在生成 PDF…');
        const { createPdfFromPages } = await import('../../lib/exportPdf');
        const { blob, pages } = await createPdfFromPages();
        downloadBlob(blob, exportFileName('pdf'));
        track('export', { format: 'pdf', result: 'saved' });
        setToast(`PDF 已下载（${pages} 页）`);
      }
    } catch (error) {
      setToast(`导出失败：${error instanceof Error ? error.message : String(error)}`);
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
      setToast('请在打印窗口中选择打印机，或「另存为 PDF」');
      track('print');
      window.print();
      return;
    }

    setExportKind('print');
    try {
      const result = await desktop.printSheet();
      if (result.needActivation) {
        setToast(result.error ?? '免费试用已结束，请激活后继续打印');
        useApp.getState().setSettingsOpen(true);
        void refreshLicense();
      } else if (result.canceled) {
        setToast('');
      } else if (result.printed) {
        setToast('已发送到打印机');
        void refreshLicense();
      } else {
        setToast(`打印失败：${result.error ?? '未知错误'}`);
      }
    } catch (error) {
      setToast(`打印失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExportKind(null);
    }
  };

  const exportDocx = async () => {
    if (exportKind) return;
    if (!(await ensureCanExport('docx'))) return;
    setExportMenu(false);
    setExportKind('docx');
    setToast('正在生成 Word 文档…');
    try {
      const { createDocxFromPages } = await import('../../lib/exportDocx');
      const { blob, pages } = await createDocxFromPages();
      const fileName = exportFileName('docx');
      const desktop = window.desktop;
      if (desktop?.isElectron) {
        const data = new Uint8Array(await blob.arrayBuffer());
        const result = await desktop.saveFile({
          defaultName: fileName,
          filters: [{ name: 'Word 文档', extensions: ['docx'] }],
          data,
          kind: 'docx',
          pages,
        });
        if (result.needActivation) {
          setToast(result.error ?? '免费试用已结束，请激活后继续导出');
          useApp.getState().setSettingsOpen(true);
          void refreshLicense();
        } else if (result.canceled) setToast('');
        else if (result.saved) {
          setToast(`Word 文档导出成功（${pages} 页）`);
          void refreshLicense();
        } else setToast(`导出失败：${result.error ?? '未知错误'}`);
      } else {
        downloadBlob(blob, fileName);
        track('export', { format: 'docx', result: 'saved' });
        setToast(`Word 文档已下载（${pages} 页）`);
      }
    } catch (error) {
      setToast(`导出失败：${error instanceof Error ? error.message : String(error)}`);
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
            <span className="stage-eyebrow">{workbook ? '练习册预览' : '字帖预览'}</span>
            <span className="stage-name">{workbook ? workbook.title : meta.label}</span>
          </div>
          <div className="stage-chips">
            <span className="meta-chip">A4</span>
            <span className="meta-chip">{pageCount} 页</span>
            {workbook && (
              <span className="meta-chip">{workbook.sections.length} 张字帖</span>
            )}
            {desktopLicense && licenseStatus && !licenseStatus.activated && (
              <span
                className={`meta-chip ${trialBlocked ? 'is-warn' : ''}`}
                title="免费试用额度：成功导出一次消耗一次"
              >
                {trialBlocked ? '试用已结束' : `试用剩余 ${remainingCount} 次`}
              </span>
            )}
            {!workbook && meta.id === 'name' && settings.nameStrokeOrder && (
              stroke.loading ? (
                <span className="meta-chip is-warn">
                  <Loader2 size={9} className="spin" /> 笔顺加载中
                </span>
              ) : stroke.error ? (
                <span className="meta-chip is-warn" title={stroke.error}>
                  笔顺加载失败
                </span>
              ) : (
                <span className="meta-chip is-green">按笔顺</span>
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
              title="退出练习册，返回单张字帖"
            >
              <ArrowLeft size={14} />
              退出练习册
            </button>
          )}

          {!workbook && isGeneratedSheet(meta) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={shuffle}
              title="重新随机生成题目"
            >
              <RefreshCw size={14} />
              换一组
            </button>
          )}

          <div className="zoom-control">
            <button type="button" aria-label="缩小" onClick={() => changeZoom(-0.1)}>
              <Minus size={13} />
            </button>
            <button
              type="button"
              className="zoom-value"
              title="适应窗口"
              onClick={() => setAutoFit(true)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" aria-label="放大" onClick={() => changeZoom(0.1)}>
              <Plus size={13} />
            </button>
            <button
              type="button"
              aria-label="适应窗口"
              title="适应窗口"
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
              title={trialBlocked ? '免费试用已结束，点击激活' : '打印字帖'}
            >
              {exportKind !== null ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Printer size={14} />
              )}
              {exportKind !== null ? '处理中…' : '打印'}
            </button>
            <button
              type="button"
              className="btn btn-primary export-caret"
              aria-label="选择导出格式"
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
                      <strong>下载 PDF</strong>
                      <small>
                        {desktopLicense ? '保存为 PDF 文件' : '通过打印窗口另存为 PDF'}
                      </small>
                    </span>
                  </button>
                  <button type="button" role="menuitem" onClick={() => void exportDocx()}>
                    <FileType2 size={17} />
                    <span>
                      <strong>下载 Word (.docx)</strong>
                      <small>按高清页面图片导出，版式一致</small>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className={`icon-btn stage-inspector-btn ${showInspector ? 'is-on' : ''}`}
            title="设置"
            aria-label="切换设置面板"
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
              <strong>正在生成 Word 文档</strong>
              <span>正在渲染 {pageCount} 页高清页面…</span>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
