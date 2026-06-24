import { Datasource, WIDGET_SIZE } from '@granit/dashboards';
import { KpiTile } from '@granit/react-analytics';
import { useInvoiceQuery } from '@granit/react-invoicing';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Button, Skeleton } from '@granit/react-ui';
import { ManualDataTable } from '@granit/react-ui-admin-kit';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CreateInvoiceDialog } from './components/create-invoice-dialog';
import { createInvoiceColumns } from './components/invoice-columns';

import type { KpiWidgetDefinition } from '@granit/analytics';

const UNPAID_COUNT_KPI: KpiWidgetDefinition = {
  slug: 'UnpaidCount',
  type: 'kpi',
  position: 0,
  size: WIDGET_SIZE.SMALL_KPI,
  datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceCountMetric'),
};

const UNPAID_TOTAL_KPI: KpiWidgetDefinition = {
  slug: 'UnpaidTotal',
  type: 'kpi',
  position: 1,
  size: WIDGET_SIZE.SMALL_KPI,
  datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceTotalMetric'),
};

const PAGE_SIZES = [10, 20, 50];

export function InvoiceListPage() {
  const { t, i18n } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();
  // Query-engine surface: server-side pagination/filter/sort lives in the
  // shared reducer (wired by InvoicingProvider). The grid renders the paged
  // result and dispatches page changes back through it.
  const { query, params, setPage, setPageSize } = useInvoiceQuery();
  const { data: invoicesPage, isLoading } = query;

  const [createOpen, setCreateOpen] = useState(false);

  const handleViewDetail = useCallback(
    (id: string) => {
      navigate(`/invoicing/${id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () =>
      createInvoiceColumns({
        t,
        formatDate,
        onViewDetail: handleViewDetail,
        locale: i18n.language,
      }),
    [t, formatDate, handleViewDetail, i18n.language]
  );

  return (
    <div data-slot="invoice-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Invoicing.List.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Invoicing.List.Subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Invoicing.Create.Button')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <KpiTile widget={UNPAID_COUNT_KPI} />
        <KpiTile widget={UNPAID_TOTAL_KPI} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <ManualDataTable
          columns={columns}
          data={invoicesPage?.items ?? []}
          totalCount={invoicesPage?.totalCount ?? 0}
          page={params.page ?? 1}
          pageSize={params.pageSize ?? 20}
          pageSizes={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          data-slot="invoice-table"
        />
      )}

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
