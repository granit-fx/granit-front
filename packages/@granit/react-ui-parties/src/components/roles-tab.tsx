import { useTranslation } from '@granit/react-localization';
import { useRemovePartyRoleMutation } from '@granit/react-parties';
import { toast, Badge, Button } from '@granit/react-ui';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { PARTY_ASSIGNABLE_ROLES, parsePartyRoleFlags } from '../constants';
import { logger } from '../logger';

import { AddRoleDialog } from './add-role-dialog';

import type { PartyId, PartyRole } from '@granit/parties';

interface RolesTabProps {
  readonly partyId: PartyId;
  readonly roles: string;
}

export function RolesTab({ partyId, roles }: RolesTabProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const remove = useRemovePartyRoleMutation();

  const current = parsePartyRoleFlags(roles);
  const assignable = PARTY_ASSIGNABLE_ROLES.filter((r) => !current.includes(r));

  const handleRemove = async (role: PartyRole) => {
    try {
      await remove.mutateAsync({ id: partyId, role });
      toast.success(t('Parties.Roles.RemoveSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[RolesTab] remove role failed', err);
    }
  };

  return (
    <div data-slot="roles-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('Parties.Roles.Title')}</h3>
        <Button size="sm" onClick={() => setOpen(true)} disabled={assignable.length === 0}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Parties.Roles.Add')}
        </Button>
      </div>

      {current.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Parties.Roles.Empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {current.map((role) => (
            <Badge key={role} variant="secondary" className="gap-1 pr-1">
              {t(`Parties.Role.${role}`)}
              <button
                type="button"
                onClick={() => handleRemove(role)}
                disabled={remove.isPending}
                aria-label={t('Common.Delete')}
                className="ml-1 rounded-sm p-0.5 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <AddRoleDialog
        partyId={partyId}
        assignableRoles={assignable}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
