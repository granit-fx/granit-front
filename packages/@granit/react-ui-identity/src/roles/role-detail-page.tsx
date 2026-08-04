import { IdentityPermissions, type IdentityUser } from '@granit/identity';
import { usePermissions } from '@granit/react-authorization';
import { useAssignRole, useRoleMembers, useRemoveRole } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { UserSearchCombobox } from '../components/user-search-combobox';

const SKELETON_ROW_KEYS = ['s0', 's1', 's2'] as const;

export function RoleDetailPage() {
  const { roleName } = useParams<{ roleName: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(IdentityPermissions.Roles.Manage);

  const { data: members, isLoading, error } = useRoleMembers(roleName ?? '');
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<IdentityUser | null>(null);

  function handleAssign(user: IdentityUser) {
    assignRole.mutate(
      { userId: user.userId, roleName: roleName! },
      {
        onSuccess: () => {
          toast.success(t('Identity.Roles.Detail.AssignSuccess', 'User assigned to role'));
          setAssignOpen(false);
        },
      }
    );
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeRole.mutate(
      { userId: removeTarget.userId, roleName: roleName! },
      {
        onSuccess: () => {
          toast.success(t('Identity.Roles.Detail.RemoveSuccess', 'User removed from role'));
          setRemoveTarget(null);
        },
      }
    );
  }

  return (
    <div data-slot="role-detail-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/identity/roles')}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">{t('Common.Back', 'Back')}</span>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Identity.Roles.Detail.Title', 'Role: {{roleName}}', { roleName })}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {t('Identity.Roles.Detail.Members', 'Members')} ({members?.length ?? 0})
        </h3>
        {canManage && (
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" />
                {t('Identity.Roles.Detail.AssignUser', 'Assign User')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('Identity.Roles.Detail.AssignUser', 'Assign User')}</DialogTitle>
              </DialogHeader>
              <UserSearchCombobox
                onSelect={handleAssign}
                excludeUserIds={members?.map((m) => m.userId) ?? []}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/50 p-8 text-center text-destructive">
          {t('Common.Error', 'An error occurred while loading data.')}
        </div>
      )}

      {!isLoading && !error && members && members.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Common.Name', 'Name')}</TableHead>
              <TableHead>{t('Common.Email', 'Email')}</TableHead>
              {canManage && (
                <TableHead className="sr-only">{t('Common.Actions', 'Actions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell className="font-medium">
                  {member.firstName} {member.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('Identity.Roles.Detail.RemoveUser', 'Remove')}
                      onClick={() => setRemoveTarget(member)}
                    >
                      <X className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && members?.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t('Identity.Roles.Detail.NoMembers', 'No users have this role')}
        </div>
      )}

      <ConfirmActionDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={t('Identity.Roles.Detail.RemoveUser', 'Remove')}
        description={t(
          'Identity.Roles.Detail.RemoveConfirm',
          'Remove {{userName}} from the {{roleName}} role?',
          {
            userName: `${removeTarget?.firstName} ${removeTarget?.lastName}`,
            roleName,
          }
        )}
        confirmLabel={t('Identity.Roles.Detail.RemoveUser', 'Remove')}
        cancelLabel={t('Common.Cancel', 'Cancel')}
        onConfirm={handleRemove}
      />
    </div>
  );
}
