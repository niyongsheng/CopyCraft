import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  FileDown,
  FileText,
  FileType2,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Scan,
  SlidersHorizontal,
} from 'lucide-react';
import { useSheetModel } from '../../hooks/useSheetModel';
import { PAGE_WIDTH, SHEET_BY_ID, isGeneratedSheet } from '../../lib/constants';
import { track } from '../../lib/analytics';
import { downloadBlob, exportFileName } from '../../lib/download';
import { useApp } from '../../store/useApp';
import {
  selectTrialBlocked,
  selectTrialRemainingCount,
  useLicense,
} from '../../store/useLicense';
import { ClockSheet } from '../sheets/ClockSheet';
import { FourLineSheet } from '../sheets/FourLineSheet';
import { GridSheet } from '../sheets/GridSheet';
import { MathSheet } from '../sheets/MathSheet';
import { NameStrokeSheet } from '../sheets/NameStrokeSheet';
import { PenSheet } from '../sheets/PenSheet';
import { VerticalSheet } from '../sheets/VerticalSheet';

export function SheetStage() {
  const activeType = useApp((s) => s.activeType);
  const meta = SHEET_BY_ID[activeType];
  const settings = useApp((s) => s.settingsByType[activeType]);
  const title = useApp((s) => s.titles[activeType]);
  const name = useApp((s) => s.contents.name);
  const shuffle = useApp((s) => s.shuffle);
  const showInspector = useApp((s) => s.showInspector);
  const toggleInspector = useApp((s) => s.toggleInspector);
  const { model, stroke } = useSheetModel();

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
  const [exportKind, setExportKind] = useState<'pdf' | 'docx' | null>(null);
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
  const pageCount = useMemo(
    () => (model.kind === 'pen' ? 1 : model.pages.length),
    [model],
  );

  const changeZoom = (delta: number) => {
    setAutoFit(false);
    setUserZoom(Math.max(0.35, Math.min(1.6, zoom + delta)));
  };

  /** 导出前向主进程确认试用 / 激活状态；受限时直接打开设置引导激活。 */
  const ensureCanExport = async (format: 'pdf' | 'docx'): Promise<boolean> => {
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
        setToast('在打印窗口中选择「另存为 PDF」即可导出多页字帖');
        window.print();
      }
    } catch (error) {
      setToast(`导出失败：${error instanceof Error ? error.message : String(error)}`);
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
        setToast(`Word 文档已下载（${pages} 页）`);
      }
    } catch (error) {
      setToast(`导出失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setExportKind(null);
    }
  };

  const sheet = useMemo(() => {
    switch (model.kind) {
      case 'grid':
        return (
          <GridSheet
            model={model}
            settings={settings}
            title={title}
            name={meta.id === 'name' ? name.split('\n')[0] : undefined}
          />
        );
      case 'name-stroke':
        return (
          <NameStrokeSheet
            model={model}
            settings={settings}
            title={title}
            name={name.split('\n')[0]}
          />
        );
      case 'fourline':
        return (
          <FourLineSheet
            model={model}
            settings={settings}
            title={title}
            showText={meta.showTextOption ? settings.showText : true}
          />
        );
      case 'pen':
        return <PenSheet model={model} settings={settings} title={title} />;
      case 'math':
        return <MathSheet model={model} settings={settings} title={title} />;
      case 'vertical':
        return <VerticalSheet model={model} settings={settings} title={title} />;
      case 'clock':
        return <ClockSheet model={model} settings={settings} title={title} />;
    }
  }, [model, settings, title, name, meta]);

  return (
    <main className="stage">
      <div className="stage-toolbar">
        <div className="stage-title">
          <div className="stage-heading">
            <span className="stage-eyebrow">字帖预览</span>
            <span className="stage-name">{meta.label}</span>
          </div>
          <div className="stage-chips">
            <span className="meta-chip">A4</span>
            <span className="meta-chip">{pageCount} 页</span>
            {desktopLicense && licenseStatus && !licenseStatus.activated && (
              <span
                className={`meta-chip ${trialBlocked ? 'is-warn' : ''}`}
                title="免费试用额度：成功导出一次消耗一次"
              >
                {trialBlocked ? '试用已结束' : `试用剩余 ${remainingCount} 次`}
              </span>
            )}
            {meta.id === 'name' && settings.nameStrokeOrder && (
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
          {isGeneratedSheet(meta) && (
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
              onClick={() => void exportPdf()}
              disabled={exportKind !== null}
              title={trialBlocked ? '免费试用已结束，点击激活' : '导出 PDF'}
            >
              {exportKind !== null ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <FileDown size={14} />
              )}
              {exportKind !== null ? '生成中…' : '导出 PDF'}
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
                    <FileText size={17} />
                    <span>
                      <strong>PDF 文档</strong>
                      <small>矢量输出，适合直接打印</small>
                    </span>
                  </button>
                  <button type="button" role="menuitem" onClick={() => void exportDocx()}>
                    <FileType2 size={17} />
                    <span>
                      <strong>Word 文档 (.docx)</strong>
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
