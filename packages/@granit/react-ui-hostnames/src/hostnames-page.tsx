import { usePermissions } from '@granit/react-authorization';
import { useHostnames } from '@granit/react-hostnames';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@granit/react-ui';
import { Loader2, Network, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { AddHostnameDialog } from './components/hostname-add-dialog';
import { DnsDetails } from './components/hostname-dns-details';
import { RowActions } from './components/hostname-row-actions';
import { CertStatusBadge, HostnameStatusBadge } from './components/hostname-status-badge';

import type { ManagedHostnameResponse } from '@granit/hostnames';

const OWNER_TYPE_OPTIONS = [
  { value: 'tenant', labelKey: 'Hostnames.Owner.Types.Tenant' },
  { value: 'cms.site', labelKey: 'Hostnames.Owner.Types.CmsSite' },
  { value: 'other', labelKey: 'Hostnames.Owner.Types.Other' },
] as const;

function HostnameLastChecked({ hostname }: { readonly hostname: ManagedHostnameResponse }) {
  const { t } = useTranslation();
  const { formatDateTime, formatTimeAgo } = useDateFormatter();

  if (!hostname.lastCheckedAt) return <>—</>;
  if (!hostname.nextCheckAt) return <span>{formatTimeAgo(hostname.lastCheckedAt)}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default underline decoration-dotted">
          {formatTimeAgo(hostname.lastCheckedAt)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {t('Hostnames.NextCheck')}: {formatDateTime(hostname.nextCheckAt)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function HostnamesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('Hostnames.Hostnames.Manage');

  const ownerType = searchParams.get('ownerType') ?? '';
  const ownerId = searchParams.get('ownerId') ?? '';

  const [ownerTypeInput, setOwnerTypeInput] = useState(ownerType);
  const [ownerIdInput, setOwnerIdInput] = useState(ownerId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const hasOwner = Boolean(ownerType && ownerId);

  const { data: hostnames, isLoading, isError } = useHostnames({ ownerType, ownerId });

  function handleSearch() {
    setSearchParams({ ownerType: ownerTypeInput, ownerId: ownerIdInput });
  }

  return (
    <div data-slot="hostnames-page" className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold text-foreground">{t('Hostnames.Title')}</h1>
      </div>

      {/* Owner selector */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="owner-type">{t('Hostnames.Owner.OwnerType')}</Label>
          <Select value={ownerTypeInput} onValueChange={setOwnerTypeInput}>
            <SelectTrigger id="owner-type" className="w-40">
              <SelectValue placeholder={t('Hostnames.Owner.SelectType')} />
            </SelectTrigger>
            <SelectContent>
              {OWNER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="owner-id">{t('Hostnames.Owner.OwnerId')}</Label>
          <Input
            id="owner-id"
            value={ownerIdInput}
            onChange={(e) => setOwnerIdInput(e.target.value)}
            className="w-64 font-mono"
            placeholder="e.g. 11111111-0001-..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
        </div>
        <Button onClick={handleSearch} disabled={!ownerTypeInput || !ownerIdInput}>
          {t('Hostnames.Owner.Search')}
        </Button>
      </div>

      {!hasOwner && (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          {t('Hostnames.SelectOwner')}
        </div>
      )}

      {hasOwner && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">{t('Hostnames.Title')}</p>
            {canManage && (
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-1.5 size-4" />
                {t('Hostnames.AddHostname')}
              </Button>
            )}
          </div>

          {isError && (
            <Alert variant="destructive">
              <AlertDescription>{t('Hostnames.LoadError')}</AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Hostnames.Columns.Host')}</TableHead>
                <TableHead>{t('Hostnames.Columns.Status')}</TableHead>
                <TableHead>{t('Hostnames.Columns.Certificate')}</TableHead>
                <TableHead>{t('Hostnames.Columns.Primary')}</TableHead>
                <TableHead>{t('Hostnames.Columns.Dns')}</TableHead>
                <TableHead>{t('Hostnames.Columns.LastCheck')}</TableHead>
                {canManage && (
                  <TableHead className="w-[120px]">{t('Hostnames.Columns.Actions')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!hostnames || hostnames.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    {t('Hostnames.Empty')}
                  </TableCell>
                </TableRow>
              )}
              {hostnames?.map((hostname) => (
                <TableRow key={hostname.id}>
                  <TableCell className="font-mono text-sm">{hostname.host}</TableCell>
                  <TableCell>
                    <HostnameStatusBadge status={hostname.status} />
                  </TableCell>
                  <TableCell>
                    <CertStatusBadge status={hostname.certificateStatus} />
                  </TableCell>
                  <TableCell>
                    {hostname.isPrimary && (
                      <Badge variant="secondary">{t('Hostnames.Primary')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DnsDetails hostname={hostname} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <HostnameLastChecked hostname={hostname} />
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <RowActions hostname={hostname} canManage={canManage} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddHostnameDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        ownerType={ownerType}
        ownerId={ownerId}
      />
    </div>
  );
}
