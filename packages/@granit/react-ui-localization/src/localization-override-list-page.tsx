import { DataExchangeProvider } from '@granit/react-data-exchange';
import { useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { Button, Spinner } from '@granit/react-ui';
import {
  FilterPresets,
  GroupBySelector,
  QueryEndpointDataTable,
  SmartFilterBar,
  SortSelector,
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

import { createLocalizationColumns } from './components/localization-columns';
import { TranslationCreateDialog } from './components/translation-create-dialog';
import { TranslationDeleteDialog } from './components/translation-delete-dialog';
import { TranslationEditDialog } from './components/translation-edit-dialog';
import { QUERY_CONFIG } from './constants';

import type { LocalizationOverride } from '@granit/localization';

export function LocalizationOverrideListPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <DataExchangeProvider>
        <LocalizationPageContent />
      </DataExchangeProvider>
    </QueryProvider>
  );
}

function LocalizationPageContent() {
  const { t } = useTranslation();

  // Dialog state
  const [editOverride, setEditOverride] = useState<LocalizationOverride | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOverride, setDeleteOverride] = useState<LocalizationOverride | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // @granit/query-engine hooks
  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<LocalizationOverride>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'key', direction: 'asc' }],
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const handleEdit = useCallback((override: LocalizationOverride) => {
    setEditOverride(override);
    setEditOpen(true);
  }, []);

  const handleDelete = useCallback((override: LocalizationOverride) => {
    setDeleteOverride(override);
    setDeleteOpen(true);
  }, []);

  const refreshGrid = useCallback(async () => {
    if (queryEndpoint.isGrouped) {
      await queryEndpoint.groupedQuery.refetch();
    } else {
      await queryEndpoint.query.refetch();
    }
  }, [queryEndpoint]);

  const columns = useMemo(
    () =>
      createLocalizationColumns({
        t,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [t, handleEdit, handleDelete]
  );

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="localization-override-list-page" className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Localization.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Localization.Subtitle')}</p>
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
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              {t('Localization.Actions.CreateOverride')}
            </Button>
            <ExportButton
              onExport={() => setExportOpen(true)}
              label={t('DataExchange.Export.Label')}
            />
            <ImportButton
              onImport={() => setImportOpen(true)}
              label={t('DataExchange.Import.Label')}
            />
          </div>
        </div>
      )}

      {/* Data table */}
      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      {/* Export / Import dialogs */}
      <ExportDialog
        definitionName="Granit.Localization.LocalizationOverrideExport"
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
        definitionName="Granit.Localization.LocalizationOverrideImport"
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Create / Edit / Delete dialogs */}
      <TranslationCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refreshGrid}
      />
      <TranslationEditDialog
        override={editOverride}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={refreshGrid}
      />
      <TranslationDeleteDialog
        override={deleteOverride}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={refreshGrid}
      />
    </div>
  );
}
