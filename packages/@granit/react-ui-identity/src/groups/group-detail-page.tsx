import { IdentityPermissions, type IdentityGroup, type IdentityUser } from '@granit/identity';
import { usePermissions } from '@granit/react-authorization';
import { useAddUserToGroup, useGroups, useRemoveUserFromGroup } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
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
} from '@granit/react-ui';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { UserSearchCombobox } from '../components/user-search-combobox';

const SKELETON_ROW_KEYS = ['s0', 's1', 's2', 's3'] as const;

function findGroup(groups: readonly IdentityGroup[], id: string): IdentityGroup | undefined {
  for (const g of groups) {
    if (g.id === id) return g;
    const found = findGroup(g.subGroups, id);
    if (found) return found;
  }
  return undefined;
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(IdentityPermissions.Groups.Manage);

  const { data: allGroups, isLoading, error } = useGroups();
  const group = useMemo(
    () => (allGroups ? findGroup(allGroups, groupId ?? '') : undefined),
    [allGroups, groupId]
  );

  const addToGroup = useAddUserToGroup();
  const removeFromGroup = useRemoveUserFromGroup();

  const [addOpen, setAddOpen] = useState(false);
  // NOTE: Group members are managed via local state because @granit/identity
  // does not yet expose a `fetchGroupMembers` endpoint (unlike roles which have
  // `fetchRoleMembers`). Members added in the current session are tracked here,
  // but pre-existing members cannot be displayed until the backend API is extended.
  const [members, setMembers] = useState<IdentityUser[]>([]);
  const [removeTarget, setRemoveTarget] = useState<IdentityUser | null>(null);

  const handleAdd = useCallback(
    (user: IdentityUser) => {
      addToGroup.mutate(
        { userId: user.userId, groupId: groupId! },
        {
          onSuccess: () => {
            toast.success(t('Identity.Groups.Detail.AddSuccess', 'User added to group'));
            setMembers((prev) => [...prev, user]);
            setAddOpen(false);
          },
        }
      );
    },
    [addToGroup, groupId, t]
  );

  const handleRemoveSuccess = useCallback(
    (userId: string) => {
      toast.success(t('Identity.Groups.Detail.RemoveSuccess', 'User removed from group'));
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      setRemoveTarget(null);
    },
    [t]
  );

  const handleRemove = useCallback(() => {
    if (!removeTarget) return;
    const userId = removeTarget.userId;
    removeFromGroup.mutate(
      { userId, groupId: groupId! },
      { onSuccess: () => handleRemoveSuccess(userId) }
    );
  }, [removeFromGroup, removeTarget, groupId, handleRemoveSuccess]);

  if (isLoading) {
    return (
      <div data-slot="group-detail-page" className="space-y-4">
        {SKELETON_ROW_KEYS.map((key) => (
          <div key={key} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (error || (!isLoading && !group)) {
    return (
      <div data-slot="group-detail-page" className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/identity/groups')}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">{t('Common.Back', 'Back')}</span>
        </Button>
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {t('Identity.Groups.Detail.NotFound', 'Group not found')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              'Identity.Groups.Detail.NotFoundMessage',
              'This group does not exist or has been removed.'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-slot="group-detail-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/identity/groups')}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">{t('Common.Back', 'Back')}</span>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Identity.Groups.Detail.Title', 'Group: {{groupName}}', {
              groupName: group?.name ?? groupId,
            })}
          </h2>
          {group?.path && (
            <Badge variant="secondary" className="mt-1 font-mono text-xs">
              {group.path}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {t('Identity.Groups.Detail.Members', 'Members')} ({members.length})
        </h3>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" />
                {t('Identity.Groups.Detail.AddMember', 'Add Member')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('Identity.Groups.Detail.AddMember', 'Add Member')}</DialogTitle>
              </DialogHeader>
              <UserSearchCombobox
                onSelect={handleAdd}
                excludeUserIds={members.map((m) => m.userId)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {members.length > 0 ? (
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
                      aria-label={t('Identity.Groups.Detail.RemoveMember', 'Remove')}
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
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {t('Common.NoResults', 'No members in this group')}
        </div>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('Identity.Groups.Detail.RemoveMember', 'Remove')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Identity.Groups.Detail.RemoveConfirm',
                'Remove {{userName}} from the {{groupName}} group?',
                {
                  userName: `${removeTarget?.firstName} ${removeTarget?.lastName}`,
                  groupName: group?.name ?? groupId,
                }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>
              {t('Identity.Groups.Detail.RemoveMember', 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
