import { DataExchangeProvider } from '@granit/react-data-exchange';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { TemplatingProvider } from '@granit/react-templating';
import { Button, Spinner } from '@granit/react-ui';
import {
  ExportButton,
  ExportDialog,
  ImportButton,
  ImportDialog,
} from '@granit/react-ui-data-exchange';
import {
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { FolderOpen, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { DEFAULT_PAGE_SIZE, QUERY_CONFIG, TEMPLATING_CONFIG } from '../constants';

import { TemplateCategoriesDialog } from './template-categories-dialog';
import { createTemplateColumns } from './template-columns';
import { TemplateDashboard } from './template-dashboard';

import type { TemplateListItem } from '@granit/templating';

export function TemplateListPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <TemplatingProvider config={TEMPLATING_CONFIG}>
        <DataExchangeProvider>
          <TemplatesPageContent />
        </DataExchangeProvider>
      </TemplatingProvider>
    </QueryProvider>
  );
}

function TemplatesPageContent() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<TemplateListItem>({
    initialParams: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: [{ field: 'name', direction: 'asc' }],
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  // Side-effecting sync of the smart-filter state into the query endpoint; the
  // returned handlePresetToggle is unused on this list page.
  useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const handleEdit = useCallback(
    (item: TemplateListItem) => {
      navigate(`/templating/templates/${item.name}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createTemplateColumns({ t, onEdit: handleEdit, formatDate }),
    [t, handleEdit, formatDate]
  );

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const items = queryEndpoint.query.data?.items ?? [];

  return (
    <div data-slot="template-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Templates.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Templates.Subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoriesOpen(true)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            {t('Templates.Categories.Title')}
          </Button>
          <Button size="sm" onClick={() => navigate('/templating/templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('Templates.Create')}
          </Button>
        </div>
      </div>

      <TemplateDashboard items={items} isLoading={queryEndpoint.query.isLoading} />

      {meta.data && (
        <div className="flex flex-col gap-4">
          <SmartFilterBar smartFilter={smartFilter} placeholder={t('Common.SearchPlaceholder')} />

          <div className="flex items-center gap-2">
            <SortSelector
              columns={meta.data.columns}
              sort={queryEndpoint.params.sort}
              onToggleSort={queryEndpoint.toggleSort}
            />
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

      <QueryDataTable
        columns={columns}
        data={queryEndpoint.isGrouped ? [] : items}
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

      <ExportDialog
        definitionName="Showcase.TemplateExport"
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
        definitionName="Showcase.TemplateImport"
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <TemplateCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}
