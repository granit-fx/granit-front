import { AIUsageProvider, useAIUsage, useAIUsageMeta } from '@granit/react-ai/usage';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { GroupBySelector, QueryDataTable, SortSelector } from '@granit/react-ui-admin-kit';
import { useMemo } from 'react';

import type { AIUsageRecord } from '@granit/ai';
import type { CellContext, ColumnDef } from '@tanstack/react-table';

function MonoCell({ value }: { readonly value: string }) {
  return <span className="font-mono text-xs">{value}</span>;
}

// Module-scope cell renderer. Inline arrows like
// `cell: ({ getValue }) => <MonoCell …/>` get flagged by Sonar's
// "component-defined-inside-parent" heuristic; hoisting them out
// silences the rule without changing tanstack-table semantics.
function renderMonoCell(info: CellContext<AIUsageRecord, unknown>): React.ReactNode {
  return <MonoCell value={info.getValue<string>()} />;
}

// Sparse identifier column: the conversation id is nullable, so fall back to a
// dash rather than rendering an empty MonoCell. Hoisted to module scope for the
// same Sonar "component-defined-inside-parent" reason as renderMonoCell.
function renderConversationCell(info: CellContext<AIUsageRecord, unknown>): React.ReactNode {
  const value = info.getValue<string | null>();
  return value ? <MonoCell value={value} /> : '-';
}

function AIUsageContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const queryEndpoint = useAIUsage();
  const meta = useAIUsageMeta();

  const columns = useMemo<ColumnDef<AIUsageRecord>[]>(
    () => [
      {
        accessorKey: 'workspaceName',
        header: t('AI.Usage.Columns.Workspace'),
        cell: renderMonoCell,
      },
      {
        accessorKey: 'provider',
        header: t('AI.Usage.Columns.Provider'),
      },
      {
        accessorKey: 'model',
        header: t('AI.Usage.Columns.Model'),
        cell: renderMonoCell,
      },
      {
        accessorKey: 'inputTokens',
        header: t('AI.Usage.Columns.InputTokens'),
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
      },
      {
        accessorKey: 'outputTokens',
        header: t('AI.Usage.Columns.OutputTokens'),
        cell: ({ getValue }) => getValue<number>().toLocaleString(),
      },
      {
        accessorKey: 'estimatedCost',
        header: t('AI.Usage.Columns.Cost'),
        cell: ({ row, getValue }) => {
          const val = getValue<number | null>();
          if (val === null) return '-';
          const currency = row.original.costCurrency;
          return currency
            ? new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency,
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
              }).format(val)
            : val.toFixed(4);
        },
      },
      {
        accessorKey: 'timestamp',
        header: t('AI.Usage.Columns.Timestamp'),
        cell: ({ getValue }) => formatDateTime(getValue<string>()),
      },
      {
        accessorKey: 'duration',
        header: t('AI.Usage.Columns.Duration'),
        cell: ({ getValue }) => getValue<string | null>() ?? '-',
      },
      {
        accessorKey: 'conversationId',
        header: t('AI.Usage.Columns.Conversation'),
        cell: renderConversationCell,
      },
    ],
    [t, formatDateTime]
  );

  return (
    <div data-slot="ai-usage-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('AI.Usage.Title')}</h2>
        <p className="text-sm text-muted-foreground">{t('AI.Usage.Description')}</p>
      </div>

      {meta.data && (
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
            {t('AI.Usage.Records')}
          </span>
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

export function AIUsagePage() {
  return (
    <AIUsageProvider>
      <AIUsageContent />
    </AIUsageProvider>
  );
}
