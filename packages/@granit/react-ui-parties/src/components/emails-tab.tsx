import { useTranslation } from '@granit/react-localization';
import { useRemovePartyEmailMutation } from '@granit/react-parties';
import { Badge, Button } from '@granit/react-ui';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

import { AddEmailDialog } from './add-email-dialog';

import type { PartyEmailId, PartyEmailResponse, PartyId } from '@granit/parties';

interface EmailsTabProps {
  readonly partyId: PartyId;
  readonly emails: readonly PartyEmailResponse[];
}

export function EmailsTab({ partyId, emails }: EmailsTabProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const remove = useRemovePartyEmailMutation();

  const handleRemove = async (emailId: PartyEmailId) => {
    try {
      await remove.mutateAsync({ id: partyId, emailId });
      toast.success(t('Parties.Emails.RemoveSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[EmailsTab] remove email failed', err);
    }
  };

  return (
    <div data-slot="emails-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('Parties.Emails.Title')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Parties.Emails.Add')}
        </Button>
      </div>

      {emails.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Parties.Emails.Empty')}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {emails.map((email) => (
            <li key={email.id} className="flex items-center justify-between gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{email.address}</span>
                {email.isPrimary && (
                  <Badge variant="secondary" className="text-xs">
                    {t('Parties.Fields.IsPrimary')}
                  </Badge>
                )}
                {email.label && (
                  <span className="text-xs text-muted-foreground">{email.label}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(email.id)}
                disabled={remove.isPending}
                aria-label={t('Common.Delete')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddEmailDialog partyId={partyId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
