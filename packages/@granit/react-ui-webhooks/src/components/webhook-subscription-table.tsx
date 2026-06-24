import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useQueryEndpoint, useQueryMeta, useSmartFilter } from '@granit/react-query-engine';
import { Spinner } from '@granit/react-ui';
import {
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { DEFAULT_PAGE_SIZE } from '../constants';

import { createSubscriptionColumns } from './webhook-subscription-columns';

import type { WebhookSubscriptionResponse } from '@granit/webhooks';

export function WebhookSubscriptionTable() {
  const { t } = useTranslation();
  const { formatDate, formatDateTime } = useDateFormatter();
  const navigate = useNavigate();

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<WebhookSubscriptionResponse>({
    initialParams: {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: [{ field: 'createdAt', direction: 'desc' }],
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const handleView = useCallback(
    (item: WebhookSubscriptionResponse) => {
      navigate(`/webhooks/${item.id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createSubscriptionColumns({ t, onView: handleView, formatDate, formatDateTime }),
    [t, handleView, formatDate, formatDateTime]
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
    <div data-slot="webhook-subscription-table" className="space-y-4">
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
    </div>
  );
}
