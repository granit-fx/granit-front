import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { MoreHorizontal } from 'lucide-react';

import type { IdentityUser } from '@granit/identity';

interface UserTableProps {
  users: readonly IdentityUser[];
  loading?: boolean;
  onViewDetails: (userId: string) => void;
}

export function UserTable({ users, loading = false, onViewDetails }: Readonly<UserTableProps>) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div data-slot="user-table" className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={`skeleton-${i}`} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        data-slot="user-table"
        className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border"
      >
        <p className="text-sm text-muted-foreground">{t('Users.NoUsers')}</p>
      </div>
    );
  }

  return (
    <div data-slot="user-table" className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-background hover:bg-background">
            <TableHead>{t('Users.Columns.Name')}</TableHead>
            <TableHead>{t('Users.Columns.Email')}</TableHead>
            <TableHead>{t('Users.Columns.Status')}</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{t('Common.Actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.userId} className="hover:bg-accent">
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">
                    {user.firstName ?? ''} {user.lastName ?? ''}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{user.username}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.email ?? '—'}</TableCell>
              <TableCell>
                <Badge
                  variant={user.enabled ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    user.enabled
                      ? 'border-success-500/25 bg-success-500/15 text-success-600 dark:text-success-500'
                      : 'bg-accent text-muted-foreground'
                  )}
                >
                  {user.enabled ? t('Users.Status.Enabled') : t('Users.Status.Disabled')}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Actions for ${user.firstName} ${user.lastName}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(user.userId)}>
                      {t('Users.Actions.ViewDetails')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
