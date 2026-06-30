import { PartiesPermissions } from '@granit/parties';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  useConfirmPartyAddressMutation,
  useRemovePartyAddressMutation,
} from '@granit/react-parties';
import { toast, Badge, Button, Card, CardContent } from '@granit/react-ui';
import { BadgeCheck, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import { AddAddressDialog } from './add-address-dialog';

import type { PartyAddressId, PartyAddressResponse, PartyId } from '@granit/parties';

interface AddressesTabProps {
  readonly partyId: PartyId;
  readonly addresses: readonly PartyAddressResponse[];
}

export function AddressesTab({ partyId, addresses }: AddressesTabProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canConfirm = hasPermission(PartiesPermissions.PartyAddresses.Confirm);
  const [open, setOpen] = useState(false);
  const remove = useRemovePartyAddressMutation();
  const confirm = useConfirmPartyAddressMutation();

  const handleRemove = async (addressId: PartyAddressId) => {
    try {
      await remove.mutateAsync({ id: partyId, addressId });
      toast.success(t('Parties.Addresses.RemoveSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[AddressesTab] remove address failed', err);
    }
  };

  const handleConfirm = async (addressId: PartyAddressId) => {
    try {
      await confirm.mutateAsync({ id: partyId, addressId });
      toast.success(t('Parties.Addresses.ConfirmSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[AddressesTab] confirm address failed', err);
    }
  };

  return (
    <div data-slot="addresses-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('Parties.Addresses.Title')}</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Parties.Addresses.Add')}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Parties.Addresses.Empty')}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{t(`Parties.AddressKind.${address.kind}`)}</Badge>
                    {address.isDefault && (
                      <Badge variant="outline">{t('Parties.Fields.IsDefault')}</Badge>
                    )}
                    {address.label && (
                      <span className="text-xs text-muted-foreground">{address.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {canConfirm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirm(address.id)}
                        disabled={confirm.isPending}
                        aria-label={t('Parties.Addresses.Confirm')}
                      >
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(address.id)}
                      disabled={remove.isPending}
                      aria-label={t('Common.Delete')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <div>{address.street1}</div>
                  {address.street2 && <div>{address.street2}</div>}
                  <div>
                    {address.postalCode} {address.city}
                    {address.state ? `, ${address.state}` : ''}
                  </div>
                  <div className="text-muted-foreground">{address.country}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddAddressDialog partyId={partyId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
