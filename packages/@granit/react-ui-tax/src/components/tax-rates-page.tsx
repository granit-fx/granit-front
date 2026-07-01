import { useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { Spinner } from '@granit/react-ui';
import {
  FilterPresets,
  QueryEndpointDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createTaxRateColumns } from './tax-rate-columns';
import { TaxRateDetailCard } from './tax-rate-detail-card';

import type { QueryConfig } from '@granit/query-engine';
import type { TaxRateEntry } from '@granit/tax';
import type { ColumnDef } from '@tanstack/react-table';

const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/tax/rates',
};

export function TaxRatesPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <TaxRatesPageContent />
    </QueryProvider>
  );
}

function TaxRatesPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode?: string }>();

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<TaxRateEntry>({
    initialParams: {
      page: 1,
      pageSize: 25,
      sort: [{ field: 'countryCode', direction: 'asc' }],
    },
  });

  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const columns = useMemo<readonly ColumnDef<TaxRateEntry, unknown>[]>(
    () =>
      createTaxRateColumns({
        t,
        onViewDetail: (code: string) => navigate(`/tax/rates/${code}`),
      }),
    [t, navigate]
  );

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="tax-rates-page" className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Tax.Rates.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Tax.Rates.Subtitle')}</p>
      </div>

      {/* Detail card when a country is selected */}
      {countryCode && <TaxRateDetailCard countryCode={countryCode} />}

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

          {meta.data.sortableFields.length > 0 && (
            <div className="flex items-center gap-2">
              <SortSelector
                columns={meta.data.columns}
                sort={queryEndpoint.params.sort}
                onToggleSort={queryEndpoint.toggleSort}
              />
            </div>
          )}
        </div>
      )}

      {/* Tax rates table */}
      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />
    </div>
  );
}
