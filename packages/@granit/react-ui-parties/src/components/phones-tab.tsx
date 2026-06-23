import { useTranslation } from '@granit/react-localization';
import { useRemovePartyPhoneMutation } from '@granit/react-parties';
import { Badge, Button } from '@granit/react-ui';
import { formatPhoneInternational } from '@granit/react-ui-admin-kit';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

import { AddPhoneDialog } from './add-phone-dialog';

import type { PartyId, PartyPhoneId, PartyPhoneResponse } from '@granit/parties';

interface PhonesTabProps {
  readonly partyId: PartyId;
  readonly phones: readonly PartyPhoneResponse[];
}

export function PhonesTab({ partyId, phones }: PhonesTabProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const remove = useRemovePartyPhoneMutation();

  const handleRemove = async (phoneId: PartyPhoneId) => {
    try {
      await remove.mutateAsync({ id: partyId, phoneId });
      toast.success(t('Parties.Phones.RemoveSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[PhonesTab] remove phone failed', err);
    }
  };

  return (
    <div data-slot="phones-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('Parties.Phones.Title')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Parties.Phones.Add')}
        </Button>
      </div>

      {phones.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Parties.Phones.Empty')}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {phones.map((phone) => (
            <li key={phone.id} className="flex items-center justify-between gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t(`Parties.PhoneKind.${phone.kind}`)}
                </Badge>
                <span className="font-mono text-sm">{formatPhoneInternational(phone.number)}</span>
                {phone.isPrimary && (
                  <Badge variant="outline" className="text-xs">
                    {t('Parties.Fields.IsPrimary')}
                  </Badge>
                )}
                {phone.label && (
                  <span className="text-xs text-muted-foreground">{phone.label}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(phone.id)}
                disabled={remove.isPending}
                aria-label={t('Common.Delete')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddPhoneDialog partyId={partyId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
