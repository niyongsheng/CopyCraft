import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useT } from '../i18n/useT';

/** Shared shell for the licence / privacy document dialogs. */
export function DocDialog({
  id,
  eyebrow,
  title,
  closeLabel,
  meta,
  children,
  onClose,
}: {
  id: string;
  eyebrow: string;
  title: string;
  closeLabel: string;
  meta: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Only close this dialog, not the settings dialog underneath.
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
        aria-labelledby={id}
      >
        <header className="settings-head">
          <div className="settings-heading">
            <span className="settings-eyebrow">{eyebrow}</span>
            <h2 id={id}>{title}</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            title={t('doc.close')}
            aria-label={closeLabel}
          >
            <X size={16} />
          </button>
        </header>
        <div className="settings-body license-body">
          <div className="license-meta">{meta}</div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
