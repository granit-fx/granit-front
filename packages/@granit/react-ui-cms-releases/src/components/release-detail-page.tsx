import { cmsConstraints } from '@granit/cms';
import { useCancelRelease, useRelease, useScheduleRelease } from '@granit/react-cms';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@granit/react-ui';
import { TimezonePicker } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { Link, useParams } from 'react-router';

import type { ReleaseActionStatus, ReleaseResponse, ReleaseStatus } from '@granit/cms';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ReleaseStatusBadge({ status }: { readonly status: ReleaseStatus }) {
  const { t } = useTranslation();
  const variantMap: Record<ReleaseStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
    Draft: 'secondary',
    Ready: 'default',
    Running: 'default',
    Done: 'outline',
    Failed: 'destructive',
  };
  const labels: Record<ReleaseStatus, string> = {
    Draft: t('cms:Releases.Status.Draft', 'Draft'),
    Ready: t('cms:Releases.Status.Ready', 'Ready'),
    Running: t('cms:Releases.Status.Running', 'Running'),
    Done: t('cms:Releases.Status.Done', 'Done'),
    Failed: t('cms:Releases.Status.Failed', 'Failed'),
  };
  return <Badge variant={variantMap[status]}>{labels[status]}</Badge>;
}

function ActionStatusBadge({ status }: { readonly status: ReleaseActionStatus }) {
  const { t } = useTranslation();
  const variantMap: Record<ReleaseActionStatus, 'secondary' | 'default' | 'destructive'> = {
    Pending: 'secondary',
    Succeeded: 'default',
    Failed: 'destructive',
  };
  const labels: Record<ReleaseActionStatus, string> = {
    Pending: t('cms:Releases.ActionStatus.Pending', 'Pending'),
    Succeeded: t('cms:Releases.ActionStatus.Succeeded', 'Succeeded'),
    Failed: t('cms:Releases.ActionStatus.Failed', 'Failed'),
  };
  return <Badge variant={variantMap[status]}>{labels[status]}</Badge>;
}

interface ScheduleFormValues {
  localDateTime: string;
  timeZoneId: string | null;
}

/** Schedule / reschedule / cancel a release. Timezone defaults to the user's zone. */
function ReleaseScheduleCard({ release }: { readonly release: ReleaseResponse }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const scheduleRelease = useScheduleRelease();
  const cancelRelease = useCancelRelease();
  // Only Draft / Ready releases can be (re)scheduled or cancelled; Running, Done
  // and Failed are terminal/in-flight on the backend.
  const isExecuted =
    release.status === 'Running' || release.status === 'Done' || release.status === 'Failed';

  // Spec-driven validation against `ScheduleReleaseRequest` — only the registered
  // `localDateTime` / `timeZoneId` fields are checked (`concurrencyStamp` is supplied
  // from the loaded release, not the form).
  const formResolver = createConstraintsResolver(cmsConstraints.ScheduleReleaseRequest, t, {
    labelResolver: (field) => t(`cms:Releases.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ScheduleFormValues>;

  const form = useForm<ScheduleFormValues>({
    resolver: formResolver,
    defaultValues: {
      localDateTime: release.schedule?.localDateTime ?? '',
      timeZoneId: release.schedule?.timeZoneId ?? null,
    },
  });

  useEffect(() => {
    form.reset({
      localDateTime: release.schedule?.localDateTime ?? '',
      timeZoneId: release.schedule?.timeZoneId ?? null,
    });
  }, [release.schedule, form]);

  function onSubmit(values: ScheduleFormValues) {
    // `mutate` (not `mutateAsync`) routes failures to the global mutation-cache
    // error toast — no local catch needed.
    scheduleRelease.mutate(
      {
        id: release.id,
        request: {
          localDateTime: values.localDateTime,
          timeZoneId: values.timeZoneId ?? '',
          concurrencyStamp: release.concurrencyStamp,
        },
      },
      {
        onSuccess: () => toast.success(t('cms:Releases.Schedule.Success', 'Release scheduled.')),
      }
    );
  }

  function handleCancelSchedule() {
    cancelRelease.mutate(release.id, {
      onSuccess: () =>
        toast.success(t('cms:Releases.Schedule.CancelSuccess', 'Schedule cancelled.')),
    });
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t('cms:Releases.Schedule.Title', 'Scheduling')}
        </h3>
        {release.schedule && !isExecuted && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelSchedule}
            disabled={cancelRelease.isPending}
          >
            {t('cms:Releases.Schedule.Cancel', 'Cancel schedule')}
          </Button>
        )}
      </div>

      {release.schedule ? (
        <p className="text-sm text-muted-foreground">
          {t('cms:Releases.ScheduledAt', 'Scheduled at')}:{' '}
          <span className="font-medium text-foreground">
            {formatDateTime(release.schedule.scheduledAtUtc)} ({release.schedule.timeZoneId})
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('cms:Releases.Schedule.None', 'Not scheduled.')}
        </p>
      )}

      {!isExecuted && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <FormField
              control={form.control}
              name="localDateTime"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>{t('cms:Releases.Fields.ScheduleAt', 'Schedule at')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeZoneId"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>{t('cms:Releases.Fields.Timezone', 'Timezone')}</FormLabel>
                  <FormControl>
                    <TimezonePicker
                      value={field.value}
                      onChange={field.onChange}
                      clearable={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={scheduleRelease.isPending}>
              {release.schedule
                ? t('cms:Releases.Schedule.Reschedule', 'Reschedule')
                : t('cms:Releases.Schedule.Submit', 'Schedule')}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

export function ReleaseDetailPage() {
  const { t } = useTranslation();
  const { id: siteId, releaseId } = useParams<{ id: string; releaseId: string }>();

  const { data: release, isLoading, isError } = useRelease(releaseId ?? '');

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  if (isError || !release) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('cms:Releases.LoadError', 'Failed to load release.')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div data-slot="release-detail-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/cms/sites/${siteId}/releases`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Releases.Title', 'Releases')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{release.name}</h2>
        <ReleaseStatusBadge status={release.status} />
      </div>

      <ReleaseScheduleCard release={release} />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          {t('cms:Releases.Actions', 'Actions')} ({release.actions.length})
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('cms:Releases.ActionColumns.ContentType', 'Content type')}</TableHead>
              <TableHead>{t('cms:Releases.ActionColumns.ContentId', 'Content ID')}</TableHead>
              <TableHead>{t('cms:Releases.ActionColumns.Culture', 'Culture')}</TableHead>
              <TableHead>{t('cms:Releases.ActionColumns.Type', 'Type')}</TableHead>
              <TableHead>{t('cms:Releases.ActionColumns.Status', 'Status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {release.actions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t('cms:Releases.NoActions', 'No actions in this release.')}
                </TableCell>
              </TableRow>
            )}
            {release.actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell className="font-mono text-xs">{action.contentType}</TableCell>
                <TableCell className="font-mono text-xs">{action.contentId}</TableCell>
                <TableCell>{action.culture ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{action.type}</Badge>
                </TableCell>
                <TableCell>
                  <ActionStatusBadge status={action.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
