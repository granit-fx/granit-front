import { downloadPartyVCard } from '@granit/parties';
import { useTranslation } from '@granit/react-localization';
import { usePartiesConfig } from '@granit/react-parties';
import { toast, Button } from '@granit/react-ui';
import { Download } from 'lucide-react';
import { useState } from 'react';

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
  const config = usePartiesConfig();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    try {
      const blob = await downloadPartyVCard(config.client, config.basePath!, partyId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFileName(partyName)}.vcf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Direct API call (not a React Query mutation), so the global
      // MutationCache.onError toast does not fire — surface the error here.
      logger.error('[DownloadVCardButton] vCard download failed', err);
      toast.error(t('Parties.VCard.Error'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <Download className="mr-1 h-4 w-4" />
      {t('Parties.VCard.Download')}
    </Button>
  );
}
