import { useTranslation } from '@granit/react-localization';
import { useDownloadPartyVCard } from '@granit/react-parties';
import { toast, Button } from '@granit/react-ui';
import { Download } from 'lucide-react';

import { logger } from '../logger';

import type { PartyId } from '@granit/parties';

interface DownloadVCardButtonProps {
  readonly partyId: PartyId;
  readonly partyName: string;
}

function safeFileName(name: string): string {
  return name.replaceAll(/[^\w.-]+/g, '-').replaceAll(/-+/g, '-') || 'party';
}

export function DownloadVCardButton({ partyId, partyName }: DownloadVCardButtonProps) {
  const { t } = useTranslation();
  const download = useDownloadPartyVCard();

  const handleClick = async () => {
    try {
      const blob = await download.mutateAsync(partyId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFileName(partyName)}.vcf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // The hook logs the failure; surface a toast since the global
      // MutationCache.onError handler is not wired for this ad-hoc download.
      logger.error('[DownloadVCardButton] vCard download failed', err);
      toast.error(t('Parties.VCard.Error'));
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={download.isPending}>
      <Download className="mr-1 h-4 w-4" />
      {t('Parties.VCard.Download')}
    </Button>
  );
}
