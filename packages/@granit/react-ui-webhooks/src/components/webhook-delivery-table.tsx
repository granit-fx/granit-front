import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useQueryEndpoint, useQueryMeta, useSmartFilter } from '@granit/react-query-engine';
import { Spinner } from '@granit/react-ui';
import {
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-admin-kit';
import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_PAGE_SIZE } from '../constants';

import { createDeliveryColumns } from './webhook-delivery-columns';
import { WebhookPayloadViewer } from './webhook-payload-viewer';

import type { FilterEntry } from '@granit/query-engine';
import type { WebhookDeliveryAttemptResponse } from '@granit/webhooks';

interface WebhookDeliveryTableProps {
  /** Scopes the (flat) deliveries query-engine grid to a single subscription. */
  subscriptionId: string;
  onRetry: (delivery: WebhookDeliveryAttemptResponse) => void;
  storePayload: boolean;
}

export function WebhookDeliveryTable({
  subscriptionId,
  onRetry,
  storePayload,
}: Readonly<WebhookDeliveryTableProps>) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDeliveryAttemptResponse | null>(
    null
  );

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<WebhookDeliveryAttemptResponse>({
    initialParams: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: [{ field: 'occurredAt', direction: 'desc' }],
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  // The deliveries endpoint is shared across subscriptions; scope it server-side.
  const baseFilters = useMemo<readonly FilterEntry[]>(
    () => [{ field: 'subscriptionId', operator: 'Eq', value: subscriptionId }],
    [subscriptionId]
  );
  useSmartFilterSync(smartFilter, queryEndpoint, meta, baseFilters);

  const handleViewPayload = useCallback(
    (delivery: WebhookDeliveryAttemptResponse) => setSelectedDelivery(delivery),
    []
  );

  const columns = useMemo(
    () =>
      createDeliveryColumns({
        t,
        onRetry,
        onViewPayload: storePayload ? handleViewPayload : undefined,
        storePayload,
        formatDateTime,
      }),
    [t, onRetry, storePayload, handleViewPayload, formatDateTime]
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
    <div data-slot="webhook-delivery-table" className="space-y-4">
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

      {selectedDelivery && (
        <WebhookPayloadViewer
          delivery={selectedDelivery}
          open={!!selectedDelivery}
          onOpenChange={(open) => !open && setSelectedDelivery(null)}
        />
      )}
    </div>
  );
}
