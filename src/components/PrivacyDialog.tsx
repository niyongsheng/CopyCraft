import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X } from 'lucide-react';
import PRIVACY_TEXT from '../../PRIVACY.md?raw';
import { MarkdownDoc } from './MarkdownDoc';

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
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
        aria-labelledby="privacy-title"
      >
        <header className="settings-head">
          <div className="settings-heading">
            <span className="settings-eyebrow">隐私与数据</span>
            <h2 id="privacy-title">隐私政策</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            title="关闭"
            aria-label="关闭隐私政策"
          >
            <X size={16} />
          </button>
        </header>
        <div className="settings-body license-body">
          <div className="license-meta">
            <ShieldCheck size={14} />
            <span>字帖内容不上传；统计与网络请求说明如下</span>
          </div>
          <MarkdownDoc>{PRIVACY_TEXT.trimEnd()}</MarkdownDoc>
        </div>
      </div>
    </div>,
    document.body,
  );
}
