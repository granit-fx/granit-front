import { useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { Button, Spinner } from '@granit/react-ui';
import {
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { createProductColumns } from './components/product-columns';
import { DEFAULT_PAGE_SIZE, QUERY_CONFIG } from './constants';

import type { ProductResponse } from '@granit/catalog';

export function CatalogListPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <CatalogListContent />
    </QueryProvider>
  );
}

function CatalogListContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<ProductResponse>({
    initialParams: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: [{ field: 'sku', direction: 'asc' }],
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const handleOpen = useCallback(
    (product: ProductResponse) => {
      navigate(`/catalog/${product.id}`);
    },
    [navigate]
  );

  const columns = useMemo(() => createProductColumns({ t, onOpen: handleOpen }), [t, handleOpen]);

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="catalog-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Catalog.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Catalog.Subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/catalog/new')}>
          <Plus className="size-4" />
          {t('Catalog.Actions.CreateProduct')}
        </Button>
      </div>

      {meta.data && (
        <div className="flex flex-col gap-4">
          <SmartFilterBar smartFilter={smartFilter} placeholder={t('Common.SearchPlaceholder')} />
          <div className="flex items-center gap-2">
            <SortSelector
              columns={meta.data.columns}
              sort={queryEndpoint.params.sort}
              onToggleSort={queryEndpoint.toggleSort}
            />
          </div>
        </div>
      )}

      <QueryDataTable
        columns={columns}
        data={queryEndpoint.query.data?.items ?? []}
        totalCount={queryEndpoint.query.data?.totalCount ?? 0}
        isLoading={queryEndpoint.query.isLoading}
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
