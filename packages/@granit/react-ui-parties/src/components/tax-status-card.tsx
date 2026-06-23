import { useTranslation } from '@granit/react-localization';
import { useClearPartyTaxStatusMutation } from '@granit/react-parties';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

import { EditTaxStatusDialog } from './edit-tax-status-dialog';

import type { PartyId, PartyTaxStatusResponse } from '@granit/parties';

interface TaxStatusCardProps {
  readonly partyId: PartyId;
  readonly taxStatus: PartyTaxStatusResponse;
}

export function TaxStatusCard({ partyId, taxStatus }: TaxStatusCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const clear = useClearPartyTaxStatusMutation();

  const isStandard = !taxStatus.isExempt && !taxStatus.reverseCharge;

  const handleClear = async () => {
    try {
      await clear.mutateAsync(partyId);
      toast.success(t('Parties.TaxStatus.ClearSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TaxStatusCard] clear tax status failed', err);
    }
  };

  return (
    <Card data-slot="tax-status-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('Parties.TaxStatus.Title')}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {t('Common.Edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={clear.isPending || isStandard}
          >
            {t('Parties.TaxStatus.Clear')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {taxStatus.isExempt && (
            <Badge variant="outline" className="text-xs">
              {t('Parties.TaxStatus.IsExempt')}
            </Badge>
          )}
          {taxStatus.reverseCharge && (
            <Badge variant="outline" className="text-xs">
              {t('Parties.TaxStatus.ReverseCharge')}
            </Badge>
          )}
          {isStandard && (
            <span className="text-sm text-muted-foreground">{t('Parties.TaxStatus.Standard')}</span>
          )}
        </div>
        {taxStatus.vatin && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('Parties.Fields.Vatin')}: </span>
            <span className="font-mono">{taxStatus.vatin}</span>
          </div>
        )}
      </CardContent>

      <EditTaxStatusDialog
        partyId={partyId}
        current={taxStatus}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}
