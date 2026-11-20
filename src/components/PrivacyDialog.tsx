import { ShieldCheck } from 'lucide-react';
import PRIVACY_TEXT from '../../PRIVACY.md?raw';
import { useT } from '../i18n/useT';
import { DocDialog } from './DocDialog';
import { MarkdownDoc } from './MarkdownDoc';

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <DocDialog
      id="privacy-title"
      eyebrow={t('privacyDialog.eyebrow')}
      title={t('privacyDialog.title')}
      closeLabel={t('privacyDialog.closeLabel')}
      onClose={onClose}
      meta={
        <>
          <ShieldCheck size={14} />
          <span>{t('privacyDialog.meta')}</span>
        </>
      }
    >
      <MarkdownDoc>{PRIVACY_TEXT.trimEnd()}</MarkdownDoc>
    </DocDialog>
  );
}
