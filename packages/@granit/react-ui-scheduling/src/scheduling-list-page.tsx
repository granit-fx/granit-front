import { usePermissions } from '@granit/react-authorization';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import {
  SchedulingProvider,
  useCancelScheduledAction,
  useRescheduleScheduledAction,
} from '@granit/react-scheduling';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
} from '@granit/react-ui';
import {
  FilterPresets,
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { SchedulingPermissions } from '@granit/scheduling';
import { toISODateString } from '@granit/types';
import { RotateCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { createSchedulingColumns } from './components/scheduling-columns';

import type { QueryConfig } from '@granit/query-engine';
import type { ScheduledActionResponse } from '@granit/scheduling';

const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/scheduling/scheduled-actions',
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function SchedulingListPage() {
  return (
    <SchedulingProvider config={{}}>
      <QueryProvider config={QUERY_CONFIG}>
        <SchedulingPageContent />
      </QueryProvider>
    </SchedulingProvider>
  );
}

function SchedulingPageContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(SchedulingPermissions.Actions.Manage);

  // Dialogs state
  const [cancelTarget, setCancelTarget] = useState<ScheduledActionResponse | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledActionResponse | null>(null);
  const [newExecuteAt, setNewExecuteAt] = useState('');

  // @granit/query-engine hooks
  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<ScheduledActionResponse>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'executeAt', direction: 'desc' }],
    },
  });
  const operatorLabels = useOperatorLabels();

  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  // Mutations
  const cancelAction = useCancelScheduledAction();
  const rescheduleAction = useRescheduleScheduledAction();
  const isMutating = cancelAction.isPending || rescheduleAction.isPending;

  const handleCancel = useCallback(
    (action: ScheduledActionResponse) => setCancelTarget(action),
    []
  );
  const handleReschedule = useCallback((action: ScheduledActionResponse) => {
    setNewExecuteAt(action.executeAt.slice(0, 16));
    setRescheduleTarget(action);
  }, []);

  const confirmCancel = () => {
    if (!cancelTarget) return;
    cancelAction.mutate(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
    });
  };

  const confirmReschedule = () => {
    if (!rescheduleTarget) return;
    rescheduleAction.mutate(
      { id: rescheduleTarget.id, request: { newExecuteAt: toISODateString(newExecuteAt) } },
      {
        onSuccess: () => {
          setRescheduleTarget(null);
          setNewExecuteAt('');
        },
      }
    );
  };

  const columns = useMemo(
    () =>
      createSchedulingColumns({
        t,
        formatDateTime,
        onCancel: handleCancel,
        onReschedule: handleReschedule,
        isMutating,
        canManage,
      }),
    [t, formatDateTime, handleCancel, handleReschedule, isMutating, canManage]
  );

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const now = new Date().toISOString().slice(0, 16);

  return (
    <div data-slot="scheduling-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Scheduling.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Scheduling.Subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={queryEndpoint.query.isFetching}
          onClick={() => queryEndpoint.query.refetch()}
        >
          <RotateCw className={`size-4 ${queryEndpoint.query.isFetching ? 'animate-spin' : ''}`} />
          {t('Common.Refresh')}
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

          <div className="flex items-center gap-2">
            <SortSelector
              columns={meta.data.columns}
              sort={queryEndpoint.params.sort}
              onToggleSort={queryEndpoint.toggleSort}
            />
          </div>
        </div>
      )}

      {/* Data table */}
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

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent data-slot="scheduling-cancel-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Scheduling.Actions.Cancel')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Scheduling.Actions.CancelConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelAction.isPending}>
              {t('Common.Close')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelAction.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Scheduling.Actions.Cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent data-slot="scheduling-reschedule-dialog">
          <DialogHeader>
            <DialogTitle>{t('Scheduling.Actions.RescheduleTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reschedule-execute-at">{t('Scheduling.Actions.NewExecuteAt')}</Label>
            <Input
              id="reschedule-execute-at"
              type="datetime-local"
              min={now}
              value={newExecuteAt}
              onChange={(e) => setNewExecuteAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleTarget(null)}
              disabled={rescheduleAction.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={rescheduleAction.isPending || !newExecuteAt || newExecuteAt < now}
            >
              {t('Scheduling.Actions.Reschedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
