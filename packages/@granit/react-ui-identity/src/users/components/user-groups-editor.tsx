import {
  useAddUserToGroup,
  useGroups,
  useRemoveUserFromGroup,
  useUserGroups,
} from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Skeleton,
} from '@granit/react-ui';
import { Users } from 'lucide-react';

import { logger } from '../../logger';

import type { UserId } from '@granit/types';

interface UserGroupsEditorProps {
  userId: UserId;
}

export function UserGroupsEditor({ userId }: Readonly<UserGroupsEditorProps>) {
  const { t } = useTranslation();
  const { data: allGroups, isLoading: loadingGroups } = useGroups();
  const { data: userGroups, isLoading: loadingUserGroups } = useUserGroups(userId);
  const addToGroup = useAddUserToGroup();
  const removeFromGroup = useRemoveUserFromGroup();

  const isLoading = loadingGroups || loadingUserGroups;
  const isMutating = addToGroup.isPending || removeFromGroup.isPending;
  if (userGroups !== undefined && !Array.isArray(userGroups)) {
    logger.error('[UserGroupsEditor] useUserGroups returned a non-array value', { userGroups });
  }
  const userGroupIds = new Set(Array.isArray(userGroups) ? userGroups.map((g) => g.id) : []);

  const handleToggle = (groupId: string, checked: boolean) => {
    if (checked) {
      addToGroup.mutate({ userId, groupId });
    } else {
      removeFromGroup.mutate({ userId, groupId });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('Users.Groups.Title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
        )}
        {!isLoading && (!allGroups || allGroups.length === 0) && (
          <p className="text-sm text-muted-foreground">{t('Users.Groups.NoGroups')}</p>
        )}
        {!isLoading && allGroups && allGroups.length > 0 && (
          <div data-slot="user-groups-editor" className="space-y-2">
            {allGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={userGroupIds.has(group.id)}
                  onCheckedChange={(checked) => handleToggle(group.id, checked === true)}
                  disabled={isMutating}
                />
                <Label htmlFor={`group-${group.id}`} className="cursor-pointer text-sm">
                  {group.name}
                </Label>
                {group.path && (
                  <span className="font-mono text-xs text-muted-foreground">{group.path}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
