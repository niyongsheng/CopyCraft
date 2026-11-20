import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scale, X } from 'lucide-react';
import ARPHICPL_TEXT from '../../ARPHICPL.TXT?raw';
import LICENSE_TEXT from '../../LICENSE?raw';
import THIRD_PARTY_TEXT from '../../THIRD_PARTY_NOTICES.md?raw';
import { MarkdownDoc } from './MarkdownDoc';

export function LicenseDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // 只关闭许可证弹窗，避免同时触发外层的设置弹窗。
      event.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div
      className="settings-backdrop license-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="settings-dialog license-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-title"
      >
        <header className="settings-head">
          <div className="settings-heading">
            <span className="settings-eyebrow">开源许可</span>
            <h2 id="license-title">许可与第三方声明</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            title="关闭"
            aria-label="关闭许可证"
          >
            <X size={16} />
          </button>
        </header>
        <div className="settings-body license-body">
          <div className="license-meta">
            <Scale size={14} />
            <span>Copyright (c) 2026 Copycraft</span>
          </div>

          <details className="license-details" open>
            <summary>项目许可（MIT）</summary>
            <pre className="license-text">{LICENSE_TEXT.trimEnd()}</pre>
          </details>

          <details className="license-details">
            <summary>第三方组件许可</summary>
            <MarkdownDoc>{THIRD_PARTY_TEXT.trimEnd()}</MarkdownDoc>
          </details>

          <details className="license-details">
            <summary>笔顺数据：Arphic Public License</summary>
            <p className="license-attribution">
              笔顺数据来自 hanzi-writer-data / Make Me a Hanzi，按 Arphic
              Public License 使用。Copyright (C) 1999 Arphic Technology Co.,
              Ltd.
            </p>
            <pre className="license-text">{ARPHICPL_TEXT.trimEnd()}</pre>
          </details>
        </div>
      </div>
    </div>,
    document.body,
  );
}
