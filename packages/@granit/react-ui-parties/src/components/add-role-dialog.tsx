import { useTranslation } from '@granit/react-localization';
import { useAddPartyRoleMutation } from '@granit/react-parties';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

import { PARTY_ASSIGNABLE_ROLES } from '../constants';
import { logger } from '../logger';

import type { PartyId, PartyRole } from '@granit/parties';

interface AddRoleDialogProps {
  readonly partyId: PartyId;
  readonly assignableRoles: readonly PartyRole[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AddRoleDialog({
  partyId,
  assignableRoles,
  open,
  onOpenChange,
}: AddRoleDialogProps) {
  const { t } = useTranslation();
  const mutation = useAddPartyRoleMutation();
  const [role, setRole] = useState<PartyRole | ''>('');

  const remaining = assignableRoles.length > 0 ? assignableRoles : PARTY_ASSIGNABLE_ROLES;

  const handleSubmit = async () => {
    if (!role) return;
    try {
      await mutation.mutateAsync({ id: partyId, request: { role } });
      toast.success(t('Parties.Roles.AddSuccess'));
      setRole('');
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[AddRoleDialog] add role failed', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="add-role-dialog">
        <DialogHeader>
          <DialogTitle>{t('Parties.Roles.AddTitle')}</DialogTitle>
          <DialogDescription>{t('Parties.Roles.AddDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={role} onValueChange={(v) => setRole(v as PartyRole)}>
            <SelectTrigger aria-label={t('Parties.Fields.Role')}>
              <SelectValue placeholder={t('Parties.Fields.Role')} />
            </SelectTrigger>
            <SelectContent>
              {remaining.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`Parties.Role.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('Common.Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !role}>
            {mutation.isPending ? t('Common.Loading') : t('Common.Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
