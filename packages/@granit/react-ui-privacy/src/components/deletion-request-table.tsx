import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useCancelDeletion, useDeletionRequests } from '@granit/react-privacy';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@granit/react-ui';
import { Loader2, XCircle } from 'lucide-react';

import { logger } from '../logger';

import { DeletionStatusBadge } from './deletion-status-badge';

function formatDeletionDate(
  item: { state: string; scheduledDeletionAt: string; cancelledAt: string | null },
  format: (date: string) => string
): string {
  if (item.state === 'Deferred') {
    return format(item.scheduledDeletionAt);
  }
  if (item.state === 'Cancelled' && item.cancelledAt) {
    return format(item.cancelledAt);
  }
  return '—';
}

export function DeletionRequestTable() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { data: requests, isLoading } = useDeletionRequests();
  const cancelMutation = useCancelDeletion();

  const handleCancel = async (requestId: string) => {
    try {
      await cancelMutation.mutateAsync(requestId);
      toast.success(t('Privacy.Deletion.CancelSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[DeletionRequestTable] Cancel deletion failed', err);
    }
  };

  return (
    <Card data-slot="deletion-request-table">
      <CardHeader>
        <CardTitle>{t('Privacy.Deletion.RequestsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && requests && requests.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Privacy.Deletion.Columns.Reason')}</TableHead>
                <TableHead>{t('Privacy.Deletion.Columns.Status')}</TableHead>
                <TableHead>{t('Privacy.Deletion.Columns.RequestedAt')}</TableHead>
                <TableHead>{t('Privacy.Deletion.Columns.ScheduledAt')}</TableHead>
                <TableHead>{t('Privacy.Deletion.Columns.Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((item) => (
                <TableRow key={item.requestId}>
                  <TableCell className="max-w-[200px] truncate text-sm">{item.reason}</TableCell>
                  <TableCell>
                    <DeletionStatusBadge status={item.state} />
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(item.requestedAt)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDeletionDate(item, formatDateTime)}
                  </TableCell>
                  <TableCell>
                    {item.state === 'Deferred' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(item.requestId)}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 size-4" />
                        )}
                        {t('Privacy.Deletion.CancelButton')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && (!requests || requests.length === 0) && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('Privacy.Deletion.NoRequests')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
