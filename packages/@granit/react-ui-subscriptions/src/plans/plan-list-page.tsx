import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { useCreatePlan } from '@granit/react-subscriptions';
import {
  Spinner,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from '@granit/react-ui';
import {
  FilterPresets,
  GroupBySelector,
  QueryEndpointDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { logger } from '../logger';

import { createPlanColumns } from './components/plan-columns';
import { PlanForm } from './components/plan-form';

import type { PlanCreateRequest, PlanQueryItem } from './types';
import type { QueryConfig } from '@granit/query-engine';

// Mounted at `subscriptions/plans` (sibling of the legacy public
// `GET /subscriptions/plans` Published-only list — QueryEngine adds `/meta`,
// `POST /query`, etc, without colliding on the bare GET). The QueryEngine
// surface serves admin needs (all lifecycle statuses) and is gated by
// `Subscriptions.Plans.Read`. See `MapGranitQuery<Plan>` in the host.
const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/subscriptions/plans',
};

function PlanListContent() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<PlanQueryItem>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'createdAt', direction: 'desc' }],
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const createPlan = useCreatePlan();
  const [createOpen, setCreateOpen] = useState(false);

  const handleView = useCallback(
    (plan: { id: string }) => {
      navigate(`/subscriptions/plans/${plan.id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createPlanColumns({ t, formatDate, onView: handleView }),
    [t, formatDate, handleView]
  );

  function handleCreate(data: PlanCreateRequest) {
    createPlan.mutate(data, {
      onSuccess: () => {
        toast.success(t('Subscriptions.Plans.CreateSuccess'));
        setCreateOpen(false);
        queryEndpoint.query.refetch().catch((err: unknown) => {
          logger.error('[PlanListPage] Refetch after create failed', err);
        });
      },
    });
  }

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="plan-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Subscriptions.Plans.Title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Subscriptions.Plans.Subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Subscriptions.Plans.Create')}
        </Button>
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
              {t('Subscriptions.Plans.Records')}
            </span>
          </div>
        </div>
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Subscriptions.Plans.Create')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('Subscriptions.Plans.Create')}
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            isPending={createPlan.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PlanListPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <PlanListContent />
    </QueryProvider>
  );
}
