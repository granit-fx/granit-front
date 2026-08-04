import { useTranslation } from '@granit/react-localization';
import { PartiesListProvider, usePartiesListQuery } from '@granit/react-parties';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import {
  PARTY_LIST_ROLE_FILTERS,
  PARTY_LIST_STATUS_FILTERS,
  type PartyListRoleFilter,
  type PartyListStatusFilter,
} from '../constants';

import { createPartyColumns } from './party-columns';

import type { PartyId } from '@granit/parties';
import type { FilterEntry } from '@granit/query-engine';

// Query-engine filterable fields backing the toolbar controls. `roles`, `name`
// and `status` are all first-class filterable fields on `GET /parties/meta`,
// so the role / status dropdowns and the name search are honored server-side
// (no client-side post-filtering — the grid is fully server-driven).
const ROLE_FIELD = 'roles';
const STATUS_FIELD = 'status';
const NAME_FIELD = 'name';

/** Rebuild the full filter array, replacing the entry for `field`. */
function withFilter(
  current: readonly FilterEntry[] | undefined,
  field: string,
  operator: FilterEntry['operator'],
  value: string | undefined
): FilterEntry[] {
  const rest = (current ?? []).filter((f) => f.field !== field);
  return value ? [...rest, { field, operator, value }] : rest;
}

export function PartiesListPage() {
  return (
    <PartiesListProvider>
      <PartiesListContent />
    </PartiesListProvider>
  );
}

function PartiesListContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const qe = usePartiesListQuery();
  const { params, setFilters } = qe;
  const filters = params.filters;

  const roleFilter = (filters?.find((f) => f.field === ROLE_FIELD)?.value ??
    'All') as PartyListRoleFilter;
  const statusFilter = (filters?.find((f) => f.field === STATUS_FIELD)?.value ??
    'All') as PartyListStatusFilter;
  const search = filters?.find((f) => f.field === NAME_FIELD)?.value ?? '';

  const handleRoleChange = useCallback(
    (value: PartyListRoleFilter) => {
      setFilters(withFilter(filters, ROLE_FIELD, 'Eq', value === 'All' ? undefined : value));
    },
    [filters, setFilters]
  );

  const handleStatusChange = useCallback(
    (value: PartyListStatusFilter) => {
      setFilters(withFilter(filters, STATUS_FIELD, 'Eq', value === 'All' ? undefined : value));
    },
    [filters, setFilters]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      const term = value.trim();
      setFilters(withFilter(filters, NAME_FIELD, 'Contains', term || undefined));
    },
    [filters, setFilters]
  );

  const handleViewDetail = useCallback(
    (id: PartyId) => {
      navigate(`/parties/${id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createPartyColumns({ t, onViewDetail: handleViewDetail }),
    [t, handleViewDetail]
  );

  return (
    <div data-slot="parties-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Parties.List.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Parties.List.Subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/parties/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Parties.Create.Button')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('Parties.List.SearchPlaceholder')}
          aria-label={t('Parties.List.SearchPlaceholder')}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-44" aria-label={t('Parties.List.FilterByRole')}>
            <SelectValue placeholder={t('Parties.List.FilterByRole')} />
          </SelectTrigger>
          <SelectContent>
            {PARTY_LIST_ROLE_FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {value === 'All' ? t('Common.All') : t(`Parties.Role.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44" aria-label={t('Parties.List.FilterByStatus')}>
            <SelectValue placeholder={t('Parties.List.FilterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            {PARTY_LIST_STATUS_FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {value === 'All' ? t('Common.All') : t(`Parties.Status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryEndpointDataTable queryEndpoint={qe} columns={columns} />
    </div>
  );
}
