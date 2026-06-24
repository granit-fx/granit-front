import { DataExchangeProvider } from '@granit/react-data-exchange';
import { useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { toast, Button, Card, CardContent, Skeleton, Spinner } from '@granit/react-ui';
import {
  EmptyState,
  FilterPresets,
  GroupBySelector,
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  ViewSwitcher,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-admin-kit';
import {
  ExportButton,
  ExportDialog,
  ImportButton,
  ImportDialog,
} from '@granit/react-ui-data-exchange';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logger } from '../logger';

import { ReferenceDataDeactivateDialog } from './reference-data-deactivate-dialog';

import type { ReferenceDataEntry } from './types';
import type { QueryConfig } from '@granit/query-engine';
import type { DataExchangeConfig } from '@granit/react-data-exchange';
import type { ViewMode } from '@granit/react-ui-admin-kit';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// Structural mutation type — avoids coupling to a specific `@tanstack/react-query`
// install (granit-front and showcase-react can resolve different copies, whose
// `UseMutationResult` types are not assignable due to QueryClient's `#private` field).
interface MutationLike<TVariables> {
  readonly mutateAsync: (variables: TVariables) => Promise<unknown>;
  readonly isPending: boolean;
}

interface ReferenceDataUpdatePayload {
  readonly code: string;
  readonly data: { readonly labelEn: string; readonly activated?: boolean };
}

export interface ReferenceDataListPageShellProps<
  T extends ReferenceDataEntry = ReferenceDataEntry,
> {
  readonly i18nPrefix: string;
  readonly basePath: string;
  readonly queryConfig: QueryConfig;
  readonly dataExchangeConfig?: DataExchangeConfig;
  readonly exportDefinition: string;
  readonly importDefinition: string;
  readonly columns: ColumnDef<T, unknown>[];
  readonly deactivateMutation: MutationLike<string>;
  readonly updateMutation: MutationLike<ReferenceDataUpdatePayload>;
  readonly showCardView?: boolean;
  readonly renderCard?: (
    entry: T,
    callbacks: {
      onEdit: (code: string) => void;
      onDeactivate: (entry: T) => void;
      onReactivate: (entry: T) => void;
    }
  ) => ReactNode;
  /** Extra view (e.g., tree view) rendered as a tab/section. */
  readonly renderExtraView?: () => ReactNode;
}

export function ReferenceDataListPageShell<T extends ReferenceDataEntry = ReferenceDataEntry>({
  queryConfig,
  dataExchangeConfig,
  ...rest
}: ReferenceDataListPageShellProps<T>) {
  return (
    <QueryProvider config={queryConfig}>
      <DataExchangeProvider {...(dataExchangeConfig ? { config: dataExchangeConfig } : {})}>
        <ListPageContent {...rest} />
      </DataExchangeProvider>
    </QueryProvider>
  );
}

function ListPageContent<T extends ReferenceDataEntry>({
  i18nPrefix,
  basePath,
  exportDefinition,
  importDefinition,
  columns,
  deactivateMutation,
  updateMutation,
  showCardView = false,
  renderCard,
  renderExtraView,
}: Omit<ReferenceDataListPageShellProps<T>, 'queryConfig' | 'dataExchangeConfig'>) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [view, setView] = useState<ViewMode>('list');
  const [dialogEntry, setDialogEntry] = useState<ReferenceDataEntry | null>(null);
  const [dialogAction, setDialogAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<T>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'labelEn', direction: 'asc' }],
      presets: { status: ['active'] },
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const handleEdit = useCallback(
    (code: string) => {
      navigate(`${basePath}/${code}`);
    },
    [navigate, basePath]
  );

  const handleOpenDeactivate = useCallback((entry: ReferenceDataEntry) => {
    setDialogEntry(entry);
    setDialogAction('deactivate');
    setDialogOpen(true);
  }, []);

  const handleOpenReactivate = useCallback((entry: ReferenceDataEntry) => {
    setDialogEntry(entry);
    setDialogAction('reactivate');
    setDialogOpen(true);
  }, []);

  const handleConfirmDialog = async () => {
    if (!dialogEntry) return;
    try {
      if (dialogAction === 'deactivate') {
        await deactivateMutation.mutateAsync(dialogEntry.code);
        toast.success(t(`${i18nPrefix}.DeactivateSuccess`));
      } else {
        await updateMutation.mutateAsync({
          code: dialogEntry.code,
          data: { labelEn: dialogEntry.labelEn, activated: true },
        });
        toast.success(t(`${i18nPrefix}.ReactivateSuccess`));
      }
      setDialogOpen(false);
      setDialogEntry(null);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[ReferenceDataListPageShell] deactivate/reactivate failed', err);
    }
  };

  // Memoize columns cast to avoid generic ColumnDef issues with QueryDataTable
  const typedColumns = useMemo(() => columns, [columns]);

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="reference-data-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t(`${i18nPrefix}.Title`)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(`${i18nPrefix}.Subtitle`)}</p>
        </div>
        <Button size="sm" onClick={() => navigate(`${basePath}/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t(`${i18nPrefix}.CreateButton`)}
        </Button>
      </div>

      {/* Smart filter bar */}
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

          <div className="flex items-center justify-between gap-2">
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
              <ExportButton
                onExport={() => setExportOpen(true)}
                label={t('DataExchange.Export.Label')}
              />
              <ImportButton
                onImport={() => setImportOpen(true)}
                label={t('DataExchange.Import.Label')}
              />
            </div>
            {(showCardView || renderExtraView) && (
              <ViewSwitcher view={view} onViewChange={setView} />
            )}
          </div>
        </div>
      )}

      {/* Extra view (e.g., tree) */}
      {renderExtraView && view === 'kanban' && renderExtraView()}

      {/* Kanban card view */}
      {showCardView && renderCard && view === 'kanban' && !renderExtraView && (
        <>
          {queryEndpoint.query.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={`skeleton-${i}`} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!queryEndpoint.query.isLoading && (queryEndpoint.query.data?.items ?? []).length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(queryEndpoint.query.data?.items ?? []).map((entry) =>
                renderCard(entry, {
                  onEdit: handleEdit,
                  onDeactivate: handleOpenDeactivate as (entry: T) => void,
                  onReactivate: handleOpenReactivate as (entry: T) => void,
                })
              )}
            </div>
          )}
          {!queryEndpoint.query.isLoading &&
            (queryEndpoint.query.data?.items ?? []).length === 0 && (
              <Card>
                <CardContent>
                  <EmptyState />
                </CardContent>
              </Card>
            )}
        </>
      )}

      {/* Table view */}
      {view !== 'kanban' && (
        <QueryDataTable
          columns={typedColumns}
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
      )}

      {/* Export / Import dialogs */}
      <ExportDialog
        definitionName={exportDefinition}
        open={exportOpen}
        onOpenChange={setExportOpen}
        sort={queryEndpoint.params.sort
          ?.map((s) => (s.direction === 'desc' ? `-${s.field}` : s.field))
          .join(',')}
        filter={Object.fromEntries(
          queryEndpoint.params.filters?.map((f) => [`${f.field}.${f.operator}`, f.value]) ?? []
        )}
        search={queryEndpoint.params.search}
      />
      <ImportDialog
        definitionName={importDefinition}
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Deactivate/Reactivate dialog */}
      <ReferenceDataDeactivateDialog
        entry={dialogEntry}
        action={dialogAction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDialog}
        isPending={deactivateMutation.isPending || updateMutation.isPending}
        i18nPrefix={i18nPrefix}
      />
    </div>
  );
}
