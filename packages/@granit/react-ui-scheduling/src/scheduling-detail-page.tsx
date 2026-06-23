import { usePermissions } from '@granit/react-authorization';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  SchedulingProvider,
  useCancelScheduledAction,
  useRescheduleScheduledAction,
  useScheduledAction,
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
} from '@granit/react-ui';
import { ScheduledActionStatus, SchedulingPermissions } from '@granit/scheduling';
import { toEntityId, toISODateString } from '@granit/types';
import { ArrowLeft, Ban, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SchedulingStatusBadge } from './components/scheduling-status-badge';

import type { ScheduledActionResponse } from '@granit/scheduling';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

export function SchedulingDetailPage() {
  return (
    <SchedulingProvider config={{}}>
      <SchedulingDetailContent />
    </SchedulingProvider>
  );
}

function SchedulingDetailContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(SchedulingPermissions.Actions.Manage);

  const actionId = toEntityId<'ScheduledAction'>(id!); // NOSONAR: id is guaranteed by router
  const actionQuery = useScheduledAction(actionId, { refetchInterval: 10_000 });
  const action = actionQuery.data;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newExecuteAt, setNewExecuteAt] = useState('');

  const cancelMutation = useCancelScheduledAction();
  const rescheduleMutation = useRescheduleScheduledAction();
  const isMutating = cancelMutation.isPending || rescheduleMutation.isPending;

  if (actionQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="py-12 text-center text-muted-foreground">{t('Scheduling.NotFound')}</div>
    );
  }

  const isPending = action.status === ScheduledActionStatus.Pending;
  const now = new Date().toISOString().slice(0, 16);

  const handleCancel = () => {
    cancelMutation.mutate(action.id, {
      onSuccess: () => setCancelOpen(false),
    });
  };

  const handleReschedule = () => {
    rescheduleMutation.mutate(
      { id: action.id, request: { newExecuteAt: toISODateString(newExecuteAt) } },
      {
        onSuccess: () => {
          setRescheduleOpen(false);
          setNewExecuteAt('');
        },
      }
    );
  };

  return (
    <div data-slot="scheduling-detail-page" className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/scheduling">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Common.Back')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t('Scheduling.Detail')}</CardTitle>
            <div className="flex items-center gap-2">
              <SchedulingStatusBadge status={action.status} />
              {canManage && isPending && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => {
                      setNewExecuteAt(action.executeAt.slice(0, 16));
                      setRescheduleOpen(true);
                    }}
                  >
                    <CalendarClock className="mr-2 size-4" />
                    {t('Scheduling.Actions.Reschedule')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => setCancelOpen(true)}
                  >
                    <Ban className="mr-2 size-4" />
                    {t('Scheduling.Actions.Cancel')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ActionFields action={action} formatDateTime={formatDateTime} t={t} />
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent data-slot="scheduling-cancel-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Scheduling.Actions.Cancel')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Scheduling.Actions.CancelConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              {t('Common.Close')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Scheduling.Actions.Cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent data-slot="scheduling-reschedule-dialog">
          <DialogHeader>
            <DialogTitle>{t('Scheduling.Actions.RescheduleTitle')}</DialogTitle>
            <DialogDescription>{t('Scheduling.Actions.RescheduleDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="detail-reschedule-execute-at">
              {t('Scheduling.Actions.NewExecuteAt')}
            </Label>
            <Input
              id="detail-reschedule-execute-at"
              type="datetime-local"
              min={now}
              value={newExecuteAt}
              onChange={(e) => setNewExecuteAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(false)}
              disabled={rescheduleMutation.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduleMutation.isPending || !newExecuteAt || newExecuteAt < now}
            >
              {t('Scheduling.Actions.Reschedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActionFieldsProps {
  readonly action: ScheduledActionResponse;
  readonly formatDateTime: (date: string | Date) => string;
  readonly t: TranslateFn;
}

function ActionFields({ action, formatDateTime, t }: ActionFieldsProps) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-sm font-medium text-muted-foreground">{t('Scheduling.Fields.Id')}</dt>
        <dd className="mt-1 font-mono text-xs break-all">{action.id}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-muted-foreground">
          {t('Scheduling.Columns.PayloadType')}
        </dt>
        <dd className="mt-1 font-mono text-sm font-medium">{action.payloadType}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-muted-foreground">
          {t('Scheduling.Columns.ExecuteAt')}
        </dt>
        <dd className="mt-1 text-sm">{formatDateTime(action.executeAt)}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-muted-foreground">
          {t('Scheduling.Columns.CreatedAt')}
        </dt>
        <dd className="mt-1 text-sm">{formatDateTime(action.createdAt)}</dd>
      </div>
      {action.executedAt && (
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            {t('Scheduling.Columns.ExecutedAt')}
          </dt>
          <dd className="mt-1 text-sm">{formatDateTime(action.executedAt)}</dd>
        </div>
      )}
      {action.correlationId && (
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            {t('Scheduling.Columns.CorrelationId')}
          </dt>
          <dd className="mt-1 font-mono text-xs break-all">{action.correlationId}</dd>
        </div>
      )}
      {action.cancelledBy && (
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            {t('Scheduling.Fields.CancelledBy')}
          </dt>
          <dd className="mt-1 text-sm">{action.cancelledBy}</dd>
        </div>
      )}
      {action.failureReason && (
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-sm font-medium text-destructive">
            {t('Scheduling.Fields.FailureReason')}
          </dt>
          <dd className="mt-1 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {action.failureReason}
          </dd>
        </div>
      )}
    </dl>
  );
}
