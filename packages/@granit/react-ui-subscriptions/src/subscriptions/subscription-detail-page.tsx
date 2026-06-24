import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useSeats, useSubscription } from '@granit/react-subscriptions';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-admin-kit';
import { toEntityId } from '@granit/types';
import { AlertCircle, ArrowLeft, Ban, RefreshCw, ArrowRightLeft, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AssignSeatDialog } from '../seats/components/assign-seat-dialog';
import { RevokeSeatDialog } from '../seats/components/revoke-seat-dialog';

import { CancelSubscriptionDialog } from './components/cancel-subscription-dialog';
import { ChangePlanDialog } from './components/change-plan-dialog';
import { MigratePriceDialog } from './components/migrate-price-dialog';
import { SubscriptionStatusBadge } from './components/subscription-status-badge';

import type { SeatResponse } from '@granit/subscriptions';

const SEATS_SKELETON_KEYS = ['s0', 's1', 's2'] as const;

export function SubscriptionDetailPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const subscriptionId = toEntityId<'Subscription'>(id ?? '');
  const { data: subscription, isLoading, error } = useSubscription(subscriptionId);
  const { data: seats, isLoading: seatsLoading } = useSeats(subscriptionId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [assignSeatOpen, setAssignSeatOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<SeatResponse | null>(null);

  if (isLoading) {
    return (
      <div data-slot="subscription-detail-page" className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div data-slot="subscription-detail-page" className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/subscriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('Subscriptions.List.BackToList')}
            </Link>
          </Button>
        </div>
        <EmptyState icon={AlertCircle} message={t('Subscriptions.List.NotFound')} />
      </div>
    );
  }

  const isActive = subscription.status === 'Active' || subscription.status === 'Trial';

  return (
    <div data-slot="subscription-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/subscriptions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Subscriptions.List.BackToList')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Subscriptions.Detail.Title')}
          </h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{subscription.id}</p>
        </div>
        <SubscriptionStatusBadge status={subscription.status} />
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setChangePlanOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {t('Subscriptions.List.ChangePlan')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMigrateOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('Subscriptions.List.MigratePrice')}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
            <Ban className="mr-2 h-4 w-4" />
            {t('Subscriptions.List.CancelSubscription')}
          </Button>
        </div>
      )}

      {/* Subscription details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Subscriptions.Detail.Info')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('Subscriptions.List.Columns.PlanId')}
              </dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{subscription.planId}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('Subscriptions.List.Columns.PeriodStart')}
              </dt>
              <dd className="mt-1 text-foreground">
                {formatDate(subscription.currentPeriodStart)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('Subscriptions.List.Columns.PeriodEnd')}
              </dt>
              <dd className="mt-1 text-foreground">{formatDate(subscription.currentPeriodEnd)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('Subscriptions.List.Columns.Seats')}
              </dt>
              <dd className="mt-1 text-foreground">
                <Badge variant="outline">{subscription.seatCount}</Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Seats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('Subscriptions.Seats.Title')}</CardTitle>
          {isActive && (
            <Button size="sm" onClick={() => setAssignSeatOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('Subscriptions.Seats.Assign')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {seatsLoading && (
            <div className="space-y-2">
              {SEATS_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!seatsLoading && (!seats || seats.length === 0) && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              {t('Subscriptions.Seats.Empty')}
            </div>
          )}
          {!seatsLoading && seats && seats.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Subscriptions.Seats.Columns.User')}</TableHead>
                    <TableHead>{t('Subscriptions.Seats.Columns.AssignedAt')}</TableHead>
                    {isActive && <TableHead className="sr-only">{t('Common.Actions')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seats.map((seat) => (
                    <TableRow key={seat.id}>
                      <TableCell className="font-medium">{seat.userId}</TableCell>
                      <TableCell>{formatDate(seat.assignedAt)}</TableCell>
                      {isActive && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(seat)}>
                            {t('Subscriptions.Seats.Revoke')}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CancelSubscriptionDialog
        subscriptionId={subscription.id}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
      <ChangePlanDialog
        subscriptionId={subscription.id}
        currentPlanId={subscription.planId}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
      />
      <MigratePriceDialog
        subscriptionId={subscription.id}
        planId={subscription.planId}
        currentPlanPriceId={subscription.planPriceId}
        open={migrateOpen}
        onOpenChange={setMigrateOpen}
      />
      <AssignSeatDialog
        subscriptionId={subscription.id}
        open={assignSeatOpen}
        onOpenChange={setAssignSeatOpen}
      />
      <RevokeSeatDialog
        subscriptionId={subscription.id}
        seat={revokeTarget}
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      />
    </div>
  );
}
