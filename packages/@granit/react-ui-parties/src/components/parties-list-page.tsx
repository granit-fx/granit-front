import { useTranslation } from '@granit/react-localization';
import { usePartiesQuery } from '@granit/react-parties';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PARTY_LIST_ROLE_FILTERS,
  PARTY_LIST_STATUS_FILTERS,
  type PartyListRoleFilter,
  type PartyListStatusFilter,
} from '../constants';

import { createPartyColumns } from './party-columns';

import type { PartyId, PartyRole } from '@granit/parties';

export function PartiesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [roleFilter, setRoleFilter] = useState<PartyListRoleFilter>('All');
  const [statusFilter, setStatusFilter] = useState<PartyListStatusFilter>('All');
  const [search, setSearch] = useState('');

  const { data: parties, isLoading } = usePartiesQuery(
    roleFilter === 'All' ? undefined : { role: roleFilter as PartyRole }
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

  const filteredParties = useMemo(() => {
    const list = parties ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [parties, search, statusFilter]);

  const table = useReactTable({
    data: [...filteredParties],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Parties.List.SearchPlaceholder')}
          aria-label={t('Parties.List.SearchPlaceholder')}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as PartyListRoleFilter)}>
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
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as PartyListStatusFilter)}
        >
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-8 text-center">
                    <span className="text-sm text-muted-foreground">
                      {t('Parties.List.NoResults')}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
