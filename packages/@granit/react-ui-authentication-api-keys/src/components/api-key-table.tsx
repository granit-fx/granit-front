import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ApiKeyEnvironmentBadge } from './api-key-environment-badge';
import { ApiKeyStatusBadge } from './api-key-status-badge';
import { getApiKeyStatus } from './api-key-status-utils';
import { ApiKeyTypeBadge } from './api-key-type-badge';

import type { ApiKeyListItemResponse } from '@granit/authentication-api-keys';

interface ApiKeyTableProps {
  items: readonly ApiKeyListItemResponse[];
  onRevoke: (key: ApiKeyListItemResponse) => void;
  onRotate: (key: ApiKeyListItemResponse) => void;
}

export function ApiKeyTable({ items, onRevoke, onRotate }: Readonly<ApiKeyTableProps>) {
  const { t } = useTranslation();
  const { formatTimeAgo } = useDateFormatter();
  const navigate = useNavigate();

  return (
    <div data-slot="api-key-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('ApiKeys.Name')}</TableHead>
            <TableHead>{t('ApiKeys.Type')}</TableHead>
            <TableHead>{t('ApiKeys.Environment')}</TableHead>
            <TableHead>{t('ApiKeys.Prefix')}</TableHead>
            <TableHead>{t('ApiKeys.LastUsedAt')}</TableHead>
            <TableHead>{t('ApiKeys.Status')}</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((key) => {
            const status = getApiKeyStatus(key.revokedAt, key.expiresAt);
            return (
              <TableRow
                key={key.id}
                className="cursor-pointer"
                onClick={() => navigate(`/api-keys/${key.id}`)}
              >
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <ApiKeyTypeBadge type={key.type} />
                </TableCell>
                <TableCell>
                  <ApiKeyEnvironmentBadge environment={key.environment} />
                </TableCell>
                <TableCell>
                  <code className="text-sm font-mono text-muted-foreground">
                    {key.prefix}...{key.lastFourChars}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {key.lastUsedAt ? formatTimeAgo(key.lastUsedAt) : '-'}
                </TableCell>
                <TableCell>
                  <ApiKeyStatusBadge status={status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/api-keys/${key.id}`);
                        }}
                      >
                        {t('Common.Details')}
                      </DropdownMenuItem>
                      {!key.revokedAt && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRotate(key);
                            }}
                          >
                            {t('ApiKeys.ConfirmRotate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRevoke(key);
                            }}
                          >
                            {t('ApiKeys.ConfirmRevoke')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
