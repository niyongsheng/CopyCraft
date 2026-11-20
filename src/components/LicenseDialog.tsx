import { Scale } from 'lucide-react';
import ARPHICPL_TEXT from '../../ARPHICPL.TXT?raw';
import LICENSE_TEXT from '../../LICENSE?raw';
import THIRD_PARTY_TEXT from '../../THIRD_PARTY_NOTICES.md?raw';
import { useT } from '../i18n/useT';
import { DocDialog } from './DocDialog';
import { MarkdownDoc } from './MarkdownDoc';

export function LicenseDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <DocDialog
      id="license-title"
      eyebrow={t('licenseDialog.eyebrow')}
      title={t('licenseDialog.title')}
      closeLabel={t('licenseDialog.closeLabel')}
      onClose={onClose}
      meta={
        <>
          <Scale size={14} />
          <span>Copyright (c) 2026 CopyCraft</span>
        </>
      }
    >
      <details className="license-details" open>
        <summary>{t('licenseDialog.mit')}</summary>
        <pre className="license-text">{LICENSE_TEXT.trimEnd()}</pre>
      </details>

      <details className="license-details">
        <summary>{t('licenseDialog.thirdParty')}</summary>
        <MarkdownDoc>{THIRD_PARTY_TEXT.trimEnd()}</MarkdownDoc>
      </details>

      <details className="license-details">
        <summary>{t('licenseDialog.arphic')}</summary>
        <p className="license-attribution">{t('licenseDialog.arphicText')}</p>
        <pre className="license-text">{ARPHICPL_TEXT.trimEnd()}</pre>
      </details>
    </DocDialog>
  );
}
