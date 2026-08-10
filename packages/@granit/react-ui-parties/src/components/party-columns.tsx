import { Button } from '@granit/react-ui';
import { Eye } from 'lucide-react';

import { PartyRolesBadges } from './party-roles-badges';
import { PartyStatusBadge } from './party-status-badge';

import type { PartyId, PartyListItemResponse } from '@granit/parties';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface PartyColumnOptions {
  readonly t: TranslateFn;
  readonly onViewDetail: (id: PartyId) => void;
}

export function createPartyColumns({
  t,
  onViewDetail,
}: PartyColumnOptions): DataTableColumnDef<PartyListItemResponse, unknown>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: t('Parties.Columns.Name'),
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
    },
    {
      id: 'kind',
      accessorKey: 'kind',
      header: t('Parties.Columns.Kind'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {t(`Parties.Kind.${row.original.kind}`)}
        </span>
      ),
    },
    {
      id: 'roles',
      accessorKey: 'roles',
      header: t('Parties.Columns.Roles'),
      cell: ({ row }) => <PartyRolesBadges roles={row.original.roles} />,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('Parties.Columns.Status'),
      cell: ({ row }) => <PartyStatusBadge status={row.original.status} />,
    },
    {
      id: 'currency',
      accessorKey: 'defaultCurrency',
      header: t('Parties.Columns.Currency'),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.defaultCurrency}
        </span>
      ),
    },
    {
      id: 'primaryEmail',
      accessorKey: 'primaryEmail',
      header: t('Parties.Columns.PrimaryEmail'),
      cell: ({ row }) => {
        // The live grid serializes the raw Party aggregate, so `primaryEmail`
        // arrives as a `PartyEmail` object; mock/denormalized sources flatten it
        // to the address string. Normalize both to the address for display.
        const primaryEmail = row.original.primaryEmail;
        const address = typeof primaryEmail === 'string' ? primaryEmail : primaryEmail?.address;
        return <span className="text-sm text-muted-foreground">{address ?? '—'}</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(row.original.id)}
          aria-label={t('Parties.Actions.ViewDetail')}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
