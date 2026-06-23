import { useTranslation } from '@granit/react-localization';
import { usePartiesQuery } from '@granit/react-parties';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
} from '@granit/react-ui';
import { useMemo, useState } from 'react';

import { PartyStatusBadge } from './party-status-badge';

import type { PartyId, PartyListItemResponse } from '@granit/parties';

interface PartyPickerDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly excludeId: PartyId;
  readonly onSelect: (party: PartyListItemResponse) => void;
}

export function PartyPickerDialog({
  open,
  onOpenChange,
  excludeId,
  onSelect,
}: PartyPickerDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePartiesQuery();

  const candidates = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      if (p.id === excludeId) return false;
      if (p.status === 'Archived') return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, excludeId, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="party-picker-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Parties.Merge.PickerTitle')}</DialogTitle>
          <DialogDescription>{t('Parties.Merge.PickerDescription')}</DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Parties.List.SearchPlaceholder')}
          aria-label={t('Parties.List.SearchPlaceholder')}
        />

        <div className="max-h-72 overflow-y-auto rounded-md border">
          {isLoading && (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          )}
          {!isLoading && candidates.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {t('Parties.Merge.PickerEmpty')}
            </p>
          )}
          {!isLoading && candidates.length > 0 && (
            <ul className="divide-y">
              {candidates.map((party) => (
                <li key={party.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(party)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{party.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t(`Parties.Kind.${party.kind}`)}
                        {party.primaryEmail ? ` · ${party.primaryEmail}` : ''}
                      </span>
                    </span>
                    <PartyStatusBadge status={party.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
