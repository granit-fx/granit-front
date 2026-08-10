import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useMeteringConfig, useUsageAggregatesQuery } from '@granit/react-metering';
import { QueryProvider, useQueryMeta, useSmartFilter } from '@granit/react-query-engine';
import {
  FilterPresets,
  GroupBySelector,
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { useMemo } from 'react';

import type { UsageAggregate } from '@granit/metering';
import type { DataTableCellContext, DataTableColumnDef } from '@granit/react-ui-kit';

function TenantCell({
  value,
  hostLabel,
}: {
  readonly value: string | null;
  readonly hostLabel: string;
}) {
  return <span className="font-mono text-xs text-muted-foreground">{value ?? hostLabel}</span>;
}

function MonoCell({ value }: { readonly value: string }) {
  return <span className="font-mono text-xs">{value}</span>;
}

// Module-scope cell renderers — see ai-usage-page for the same pattern.
function renderTenantCell(hostLabel: string) {
  return function TenantCellRenderer(
    info: DataTableCellContext<UsageAggregate, unknown>
  ): React.ReactNode {
    return <TenantCell value={info.getValue<string | null>()} hostLabel={hostLabel} />;
  };
}

function renderMonoCellUsage(info: DataTableCellContext<UsageAggregate, unknown>): React.ReactNode {
  return <MonoCell value={info.getValue<string>()} />;
}

function UsageAggregatesContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const queryEndpoint = useUsageAggregatesQuery();
  const meta = useQueryMeta();
  const operatorLabels = useOperatorLabels();

  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const columns = useMemo<DataTableColumnDef<UsageAggregate>[]>(
    () => [
      {
        accessorKey: 'tenantId',
        header: t('Metering.Usage.Columns.Tenant'),
        cell: renderTenantCell(t('Metering.Usage.HostScope')),
      },
      {
        accessorKey: 'meterDefinitionId',
        header: t('Metering.Usage.Columns.Meter'),
        cell: renderMonoCellUsage,
      },
      {
        accessorKey: 'period',
        header: t('Metering.Usage.Columns.Period'),
      },
      {
        accessorKey: 'periodStart',
        header: t('Metering.Usage.Columns.PeriodStart'),
        cell: ({ getValue }) => formatDateTime(getValue<string>()),
      },
      {
        accessorKey: 'periodEnd',
        header: t('Metering.Usage.Columns.PeriodEnd'),
        cell: ({ getValue }) => formatDateTime(getValue<string>()),
      },
      {
        accessorKey: 'aggregatedValue',
        header: t('Metering.Usage.Columns.AggregatedValue'),
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
      },
      {
        accessorKey: 'eventCount',
        header: t('Metering.Usage.Columns.EventCount'),
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
      },
    ],
    [t, formatDateTime]
  );

  return (
    <div data-slot="metering-usage-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Metering.Usage.Title')}</h2>
        <p className="text-sm text-muted-foreground">{t('Metering.Usage.Description')}</p>
      </div>

      {meta.data && (
        <div className="flex flex-col gap-4">
          <SmartFilterBar smartFilter={smartFilter} placeholder={t('Common.SearchPlaceholder')} />

          {meta.data.presetFilterGroups.length > 0 && (
            <FilterPresets
              groups={meta.data.presetFilterGroups}
              activePresets={smartFilter.presets}
              onToggle={handlePresetToggle}
            />
          )}

          <div className="flex items-center gap-2">
            <SortSelector
              columns={meta.data.columns}
              sort={queryEndpoint.params.sort}
              onToggleSort={queryEndpoint.toggleSort}
            />
            {meta.data.groupByFields.length > 0 && (
              <GroupBySelector
                fields={meta.data.groupByFields}
                columns={meta.data.columns}
                value={queryEndpoint.params.groupBy}
                onValueChange={queryEndpoint.setGroupBy}
              />
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              {queryEndpoint.isGrouped
                ? (queryEndpoint.groupedQuery.data?.totalCount ?? 0)
                : (queryEndpoint.query.data?.totalCount ?? 0)}{' '}
              {t('Metering.Usage.Records')}
            </span>
          </div>
        </div>
      )}

      <QueryDataTable
        columns={columns}
        data={queryEndpoint.isGrouped ? [] : (queryEndpoint.query.data?.items ?? [])}
        groups={queryEndpoint.isGrouped ? queryEndpoint.groupedQuery.data?.groups : undefined}
        totalCount={
          queryEndpoint.isGrouped
            ? (queryEndpoint.groupedQuery.data?.totalCount ?? 0)
            : (queryEndpoint.query.data?.totalCount ?? 0)
        }
        isLoading={
          queryEndpoint.isGrouped
            ? queryEndpoint.groupedQuery.isLoading
            : queryEndpoint.query.isLoading
        }
        page={queryEndpoint.params.page}
        pageSize={queryEndpoint.params.pageSize}
        sort={queryEndpoint.params.sort}
        onPageChange={queryEndpoint.setPage}
        onPageSizeChange={queryEndpoint.setPageSize}
        onToggleSort={queryEndpoint.toggleSort}
      />
    </div>
  );
}

export function MeteringUsagePage() {
  // The usage-aggregates grid is a sibling QueryEngine group to the meter
  // catalog wired by MeteringProvider — it needs its own QueryProvider scope.
  // Base path + client are derived from the metering config (no hardcoding), so
  // the two grids stay in sync with the resolved provider basePath.
  const config = useMeteringConfig();
  return (
    <QueryProvider
      config={{ client: config.client, basePath: `${config.basePath}/usage-aggregates` }}
    >
      <UsageAggregatesContent />
    </QueryProvider>
  );
}
