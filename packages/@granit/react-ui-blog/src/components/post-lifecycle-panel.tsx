import {
  useCancelPostSchedule,
  usePublishPost,
  useSchedulePost,
  useUnpublishPost,
} from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import { toast, Button, Input, Label, Separator, StatusBadge } from '@granit/react-ui';
import { TimezonePicker } from '@granit/react-ui-kit';
import { useState } from 'react';

import type { BlogPostResponse } from '@granit/blog';

export interface PostLifecyclePanelProps {
  readonly post: BlogPostResponse;
}

/** Parses `{ status, detail }` from a rejected mutation error (RFC 7807 body). */
function errorInfo(error: unknown): { status: number | null; detail: string | null } {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return { status: null, detail: null };
  }
  const response = (error as { response?: { status?: number; data?: { detail?: string } } })
    .response;
  return { status: response?.status ?? null, detail: response?.data?.detail ?? null };
}

/**
 * Publish / unpublish / schedule / cancel-schedule for a post. Scheduling takes a
 * wall-clock local time + IANA zone (resolved server-side, DST-correct). A `422`
 * (no draft to publish / invalid schedule) surfaces the backend's localized
 * `detail`, falling back to the "nothing to publish" message.
 */
export function PostLifecyclePanel({ post }: PostLifecyclePanelProps) {
  const { t } = useTranslation();
  const publish = usePublishPost();
  const unpublish = useUnpublishPost();
  const schedule = useSchedulePost();
  const cancelSchedule = useCancelPostSchedule();

  const [localDateTime, setLocalDateTime] = useState('');
  const [timeZoneId, setTimeZoneId] = useState<string | null>(null);

  const isScheduled = Boolean(post.scheduledAtUtc);

  function handlePublishError(error: unknown) {
    const { status, detail } = errorInfo(error);
    if (status === 422) {
      toast.error(detail ?? t('blog:Lifecycle.NoDraft', 'There is no draft to publish.'));
      return;
    }
    toast.error(detail ?? t('blog:Lifecycle.ActionError', 'The action could not be completed.'));
  }

  function onPublish() {
    publish.mutate(post.id, {
      onSuccess: () => toast.success(t('blog:Lifecycle.Published', 'Post published.')),
      onError: handlePublishError,
    });
  }

  function onUnpublish() {
    unpublish.mutate(post.id, {
      onSuccess: () => toast.success(t('blog:Lifecycle.Unpublished', 'Post unpublished.')),
      onError: handlePublishError,
    });
  }

  function onSchedule() {
    if (!localDateTime || !timeZoneId) {
      toast.error(t('blog:Lifecycle.ScheduleIncomplete', 'Pick a date/time and a time zone.'));
      return;
    }
    schedule.mutate(
      { id: post.id, request: { localDateTime, timeZoneId } },
      {
        onSuccess: () => toast.success(t('blog:Lifecycle.Scheduled', 'Post scheduled.')),
        onError: handlePublishError,
      }
    );
  }

  function onCancelSchedule() {
    cancelSchedule.mutate(post.id, {
      onSuccess: () => toast.success(t('blog:Lifecycle.ScheduleCancelled', 'Schedule cancelled.')),
    });
  }

  return (
    <div data-slot="post-lifecycle-panel" className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{t('blog:Lifecycle.Status', 'Status')}:</span>
        {isScheduled ? (
          <StatusBadge intent="warning">
            {t('blog:Lifecycle.ScheduledFor', 'Scheduled for {{at}}', {
              at: new Date(post.scheduledAtUtc!).toISOString(),
            })}
          </StatusBadge>
        ) : (
          <StatusBadge intent="neutral">
            {t('blog:Lifecycle.NotScheduled', 'Not scheduled')}
          </StatusBadge>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onPublish} disabled={publish.isPending}>
          {t('blog:Lifecycle.Publish', 'Publish now')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onUnpublish}
          disabled={unpublish.isPending}
        >
          {t('blog:Lifecycle.Unpublish', 'Unpublish')}
        </Button>
        {isScheduled && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelSchedule}
            disabled={cancelSchedule.isPending}
          >
            {t('blog:Lifecycle.CancelSchedule', 'Cancel schedule')}
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-medium">
          {t('blog:Lifecycle.ScheduleTitle', 'Schedule publication')}
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-datetime">
              {t('blog:Lifecycle.LocalDateTime', 'Local date & time')}
            </Label>
            <Input
              id="schedule-datetime"
              type="datetime-local"
              value={localDateTime}
              onChange={(e) => setLocalDateTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-timezone">{t('blog:Lifecycle.TimeZone', 'Time zone')}</Label>
            <TimezonePicker
              id="schedule-timezone"
              value={timeZoneId}
              onChange={setTimeZoneId}
              ariaLabel={t('blog:Lifecycle.TimeZone', 'Time zone')}
            />
          </div>
          <Button type="button" onClick={onSchedule} disabled={schedule.isPending}>
            {t('blog:Lifecycle.ScheduleAction', 'Schedule')}
          </Button>
        </div>
      </div>
    </div>
  );
}
