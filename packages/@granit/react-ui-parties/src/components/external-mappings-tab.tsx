import { useTranslation } from '@granit/react-localization';
import { useRemovePartyExternalMappingMutation } from '@granit/react-parties';
import {
  Badge,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from '@granit/react-ui';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import { AddExternalMappingDialog } from './add-external-mapping-dialog';

import type { PartyExternalMappingResponse, PartyId } from '@granit/parties';

interface ExternalMappingsTabProps {
  readonly partyId: PartyId;
  readonly mappings: readonly PartyExternalMappingResponse[];
}

export function ExternalMappingsTab({ partyId, mappings }: ExternalMappingsTabProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const remove = useRemovePartyExternalMappingMutation();

  const handleRemove = async () => {
    if (!confirmRemove) return;
    try {
      await remove.mutateAsync({ id: partyId, providerName: confirmRemove });
      toast.success(t('Parties.ExternalMappings.RemoveSuccess'));
      setConfirmRemove(null);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[ExternalMappingsTab] remove mapping failed', err);
    }
  };

  return (
    <div data-slot="external-mappings-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('Parties.ExternalMappings.Title')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Parties.ExternalMappings.Add')}
        </Button>
      </div>

      {mappings.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Parties.ExternalMappings.Empty')}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {mappings.map((mapping) => (
            <li key={mapping.id} className="flex items-center justify-between gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs uppercase">
                  {mapping.providerName}
                </Badge>
                <span className="font-mono text-sm">{mapping.externalId}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(mapping.providerName)}
                disabled={remove.isPending}
                aria-label={t('Common.Delete')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddExternalMappingDialog partyId={partyId} open={open} onOpenChange={setOpen} />

      <AlertDialog open={confirmRemove !== null} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Parties.ExternalMappings.RemoveConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Parties.ExternalMappings.RemoveConfirmDescription', {
                provider: confirmRemove ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? t('Common.Loading') : t('Common.Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
