import { isAxiosError } from '@granit/api-client';
import { useTranslation } from '@granit/react-localization';
import {
  applyToggleResult,
  useTimeline,
  useTimelineActions,
  useTimelineFollowers,
  useUpdateEntryBody,
} from '@granit/react-timeline';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@granit/react-ui';
import {
  TimelineEntryNotEditableReason,
  TimelineEntryOrigin,
  TimelineEntryType,
} from '@granit/timeline';
import { cn } from '@granit/utils';
import { AlertCircle, AlertTriangle, Bell, BellOff, MessageSquare, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';


import { TimelineComposer } from './timeline-composer';
import { TimelineStream } from './timeline-stream';

import type {
  PostTimelineEntryRequest,
  MentionSuggestion,
  ReactionToggleResponse,
  TimelineStreamEntryResponse,
  TimelineEntryId,
  TimelineEntryNotEditableReasonValue,
} from '@granit/timeline';


// Single-pass tokenizer for the timeline body. Branch 1 is the canonical
// mention payload (`@[Name](user:guid)`) emitted by `<TimelineComposer>`
// and parsed server-side by `Granit.Timeline.Internal.MentionParser`.
// Branch 2 matches autolinked URLs typed in prose — `http(s)://…` until
// whitespace or angle bracket; trailing prose punctuation is trimmed in
// JS (regex lookbehind would lock us into modern engines unnecessarily).
// The GUID shape uses a compact `[0-9a-f-]{36}` class (case-insensitive flag)
// to keep regex complexity below SonarJS's threshold — exact RFC 4122
// validation happens server-side.
const BODY_TOKEN_REGEX = /@\[([^\]]+)\]\(user:([0-9a-f-]{36})\)|(https?:\/\/[^\s<>]+)/gi;

// Characters that typically belong to surrounding prose rather than the
// URL itself (sentence-ending punctuation, closing brackets, quotes).
// Stripped repeatedly so e.g. `(https://example.com).` keeps both the
// `.` and `)` outside the link.
const TRAILING_URL_CHARS = new Set(['.', ',', ';', ':', '!', '?', ')', ']', '"', "'"]);

function trimTrailingPunctuation(url: string): { url: string; trailing: string } {
  let end = url.length;
  while (end > 0 && TRAILING_URL_CHARS.has(url.charAt(end - 1))) end--;
  return { url: url.slice(0, end), trailing: url.slice(end) };
}

// Same-origin URLs stay in-app via React Router so SPA state survives
// the navigation; cross-origin URLs open in a new tab with the standard
// reverse-tabnabbing protection (`noopener` strips `window.opener`,
// `noreferrer` drops the Referer header).
function renderUrlLink(href: string, key: string): React.ReactNode {
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return href;
  }
  const sameOrigin = parsed.origin === globalThis.location?.origin;
  if (sameOrigin) {
    return (
      <Link
        key={key}
        to={`${parsed.pathname}${parsed.search}${parsed.hash}`}
        className="text-primary underline-offset-2 hover:underline"
        data-testid="timeline-url-link"
      >
        {href}
      </Link>
    );
  }
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-2 hover:underline"
      data-testid="timeline-url-link"
      data-external=""
    >
      {href}
    </a>
  );
}

// Default body renderer: walks the body once, producing a mix of text
// segments, mention `<Link>`s, and URL anchors. Hosts can override the
// whole renderer via the `renderBody` prop if they need different
// routing (e.g. tenant-scoped) or richer markdown.
function renderBodyWithMentions(body: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  BODY_TOKEN_REGEX.lastIndex = 0;
  while ((match = BODY_TOKEN_REGEX.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index));
    }
    const [whole, displayName, userId, urlMatch] = match;
    if (urlMatch === undefined) {
      nodes.push(
        <Link
          key={`mention-${match.index}-${userId}`}
          to={`/identity/users/${userId}`}
          className="rounded px-1 py-0.5 font-medium text-primary hover:bg-primary/10"
          data-testid="timeline-mention-link"
        >
          @{displayName}
        </Link>
      );
    } else {
      const { url, trailing } = trimTrailingPunctuation(urlMatch);
      nodes.push(renderUrlLink(url, `url-${match.index}`));
      if (trailing) nodes.push(trailing);
    }
    lastIndex = match.index + whole.length;
  }
  if (lastIndex < body.length) {
    nodes.push(body.slice(lastIndex));
  }
  return nodes.length === 0 ? body : nodes;
}

/** Default edit window — matches the backend's `TimelineOptions.EditWindow` default (15 min). */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Maps the RFC 7807 `timeline-entry-not-editable` rejection (returned
 * by the PATCH endpoint when one of the four edit gates fires) to a
 * localised toast. Falls through to a generic error toast for any
 * other failure shape.
 */
function handleEditRejection(err: unknown, t: ReturnType<typeof useTranslation>['t']): void {
  if (isAxiosError(err) && err.response?.status === 403) {
    const data = err.response.data as
      | { type?: string; extensions?: { reason?: string } }
      | undefined;
    if (data?.type === 'timeline-entry-not-editable') {
      const reason = data.extensions?.reason as TimelineEntryNotEditableReasonValue | undefined;
      const fallbacks: Record<TimelineEntryNotEditableReasonValue, string> = {
        [TimelineEntryNotEditableReason.ExternalOrigin]:
          'This entry comes from an external source and cannot be edited here.',
        [TimelineEntryNotEditableReason.SystemLog]: 'System log entries are immutable.',
        [TimelineEntryNotEditableReason.NotAuthor]: 'You can only edit entries you authored.',
        [TimelineEntryNotEditableReason.WindowExpired]:
          'The edit window for this entry has expired.',
      };
      const key = reason ? `Timeline.EditReject.${reason}` : 'Timeline.EditReject.Unknown';
      const fallback = (reason && fallbacks[reason]) ?? 'This entry cannot be edited.';
      // 403 rejections are excluded from the global MutationCache.onError toast,
      // so this domain-specific message is the only one surfaced to the user.
      toast.error(t(key, { defaultValue: fallback }));
    }
  }
  // Any other failure shape is surfaced by the global MutationCache.onError toast.
}

export interface EntityTimelineProps {
  entityType: string;
  entityId: string;
  /** Entry types available in the composer. Default: [Comment, InternalNote] */
  entryTypes?: TimelineEntryType[];
  /** Number of entries per page. Default: 20 */
  pageSize?: number;
  /**
   * Forwarded to each `<TimelineStreamEntryResponse>`'s reaction bar. Hosts compute it
   * via `usePermissions().hasPermission('Timeline.Reactions.React')` at the call
   * site so this component stays QueryClient-free for stories / tests
   * that don't need the auth stack mounted. Default: `false`.
   */
  canReact?: boolean;
  /**
   * Forwarded to `<TimelineComposer>` to drive @-mention autocomplete.
   * Kept page-level so this component stays Identity-stack-agnostic
   * (stories/tests can mount without `IdentityProvider`).
   */
  searchMentions?: (query: string) => Promise<MentionSuggestion[]>;
  /**
   * Id of the signed-in user (`user.sub`). Hosts read it from
   * `useAuth()` at the call site so this neutral component stays
   * Identity-stack-agnostic — same rationale as `canReact` /
   * `searchMentions`. Drives author-only edit gating; `undefined`
   * disables editing.
   */
  currentUserId?: string;
  className?: string;
}

function EntityTimelineInner({
  entityType,
  entityId,
  // Admin: InternalNote visible in composer (hidden in patient-facing front).
  // The stream renders ALL entry types unfiltered (Comment, InternalNote, SystemLog).
  entryTypes = [TimelineEntryType.Comment, TimelineEntryType.InternalNote],
  pageSize = 20,
  canReact = false,
  searchMentions,
  currentUserId,
  className,
}: Readonly<EntityTimelineProps>) {
  const { t } = useTranslation();
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    readonly id: TimelineEntryId;
    readonly originalBody: string;
    readonly originalEntryType: TimelineEntryType;
  } | null>(null);

  const {
    entries,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    addOptimisticEntry,
    removeOptimisticEntry,
    patchEntry,
    degradedSources,
  } = useTimeline({ entityType, entityId, pageSize });

  const updateBody = useUpdateEntryBody();

  const {
    followers,
    isFollowing,
    loading: followersLoading,
    follow,
    unfollow,
  } = useTimelineFollowers({ entityType, entityId, currentUserId });

  const handleFollowToggle = useCallback(() => {
    const action = isFollowing ? unfollow : follow;
    action().catch(() => {}); // errors already surfaced via hook's internal logger
  }, [isFollowing, follow, unfollow]);

  const { postEntry, removeEntry } = useTimelineActions({
    entityType,
    entityId,
    onEntryCreated: addOptimisticEntry,
    onEntryDeleted: removeOptimisticEntry,
  });

  const handleSubmit = useCallback(
    async (request: PostTimelineEntryRequest) => {
      await postEntry(request);
      setReplyTo(undefined);
      setComposerOpen(false);
    },
    [postEntry]
  );

  const handleReply = useCallback((entryId: string) => {
    setReplyTo(entryId);
    setComposerOpen(true);
  }, []);

  const handleComposerOpenChange = useCallback((open: boolean) => {
    setComposerOpen(open);
    if (!open) setReplyTo(undefined);
  }, []);

  const handleDelete = useCallback(
    async (entryId: string) => {
      await removeEntry(entryId);
    },
    [removeEntry]
  );

  const handleEdit = useCallback(
    (entryId: TimelineEntryId, currentBody: string, originalEntryType: TimelineEntryType) => {
      setEditingEntry({ id: entryId, originalBody: currentBody, originalEntryType });
    },
    []
  );

  const closeEdit = useCallback(() => {
    setEditingEntry(null);
  }, []);

  // `request` shape comes from `<TimelineComposer>`'s create contract;
  // we only care about `body` here — entryType isn't reclassified on
  // edit (the selector is hidden) and parentEntryId is N/A for edits.
  const handleEditSubmit = useCallback(
    async (request: PostTimelineEntryRequest) => {
      if (!editingEntry) return;
      const trimmed = request.body.trim();
      if (!trimmed || trimmed === editingEntry.originalBody) {
        closeEdit();
        return;
      }
      try {
        await updateBody.mutateAsync({
          entityType,
          entityId,
          entryId: editingEntry.id,
          body: trimmed,
        });
        const nowIso = new Date().toISOString();
        patchEntry(editingEntry.id, (entry) => ({
          ...entry,
          body: trimmed,
          editedAt: nowIso as TimelineStreamEntryResponse['editedAt'],
        }));
        closeEdit();
      } catch (err) {
        handleEditRejection(err, t);
      }
    },
    [editingEntry, updateBody, entityType, entityId, patchEntry, closeEdit, t]
  );

  const canEditEntry = useCallback(
    (entry: TimelineStreamEntryResponse): boolean => {
      if (!currentUserId) return false;
      if ((entry.origin ?? TimelineEntryOrigin.Native) !== TimelineEntryOrigin.Native) return false;
      if (entry.entryType === TimelineEntryType.SystemLog) return false;
      if (entry.authorId !== currentUserId) return false;
      const age = Date.now() - new Date(entry.occurredAt).getTime();
      return age < EDIT_WINDOW_MS;
    },
    [currentUserId]
  );

  const handleReactionToggled = useCallback(
    (entryId: TimelineEntryId, result: ReactionToggleResponse) => {
      patchEntry(entryId, (entry) => ({
        ...entry,
        reactions: applyToggleResult(entry.reactions, result),
      }));
    },
    [patchEntry]
  );

  const degradedLabel = useMemo(
    () => (degradedSources.length > 0 ? degradedSources.join(', ') : null),
    [degradedSources]
  );

  // API errors (incl. the 400 timeline-depth-exceeded problem) are surfaced by
  // the global QueryCache.onError toast.

  if (loading && entries.length === 0) {
    return (
      <Card className={className} data-slot="entity-timeline">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('Timeline.Title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (error && entries.length === 0) {
    return (
      <Card className={className} data-slot="entity-timeline">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t('Timeline.Title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
            <p className="text-sm font-medium text-foreground">{t('Timeline.ErrorTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('Timeline.ErrorMessage')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)} data-slot="entity-timeline">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <CardTitle className="flex min-w-0 items-center gap-2">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="truncate">{t('Timeline.Title')}</span>
          </CardTitle>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleFollowToggle}
            disabled={followersLoading}
            aria-pressed={isFollowing}
            aria-label={
              isFollowing
                ? t('Timeline.Unfollow', { defaultValue: 'Unfollow' })
                : t('Timeline.Follow', { defaultValue: 'Follow' })
            }
            data-testid="timeline-follow-button"
            className="shrink-0"
          >
            {isFollowing ? (
              <BellOff className="mr-1 h-4 w-4" aria-hidden />
            ) : (
              <Bell className="mr-1 h-4 w-4" aria-hidden />
            )}
            {isFollowing
              ? t('Timeline.Unfollow', { defaultValue: 'Unfollow' })
              : t('Timeline.Follow', { defaultValue: 'Follow' })}
            {followers.length > 0 && (
              <span className="ml-1 tabular-nums text-xs text-muted-foreground">
                ({followers.length})
              </span>
            )}
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setComposerOpen(true)}
          aria-label={t('Timeline.AddEntry', { defaultValue: 'Add entry' })}
          data-testid="timeline-add-button"
          className="w-full"
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          {t('Common.Add')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {degradedLabel && (
          <output
            data-testid="timeline-degraded-banner"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {t('Timeline.PartialData', {
                defaultValue: `Partial data — these sources are unavailable: ${degradedLabel}.`,
                sources: degradedLabel,
              })}
            </span>
          </output>
        )}

        <TimelineStream
          entries={entries}
          entityType={entityType}
          entityId={entityId}
          canReact={canReact}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onReply={handleReply}
          onDelete={handleDelete}
          onEdit={currentUserId ? handleEdit : undefined}
          canEdit={canEditEntry}
          onReactionToggled={handleReactionToggled}
          renderBody={renderBodyWithMentions}
          emptyMessage={t('Timeline.Empty')}
        />
      </CardContent>

      <Dialog open={composerOpen} onOpenChange={handleComposerOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {replyTo
                ? t('Timeline.ReplyDialogTitle', { defaultValue: 'Reply to entry' })
                : t('Timeline.AddDialogTitle', { defaultValue: 'Add timeline entry' })}
            </DialogTitle>
            <DialogDescription>
              {replyTo
                ? t('Timeline.ReplyingTo')
                : t('Timeline.AddDialogDescription', {
                    defaultValue: 'Write a comment or internal note.',
                  })}
            </DialogDescription>
          </DialogHeader>
          <TimelineComposer
            onSubmit={handleSubmit}
            parentEntryId={replyTo}
            entryTypes={entryTypes}
            searchMentions={searchMentions}
            placeholder={t('Timeline.AddComment')}
            submitLabel={t('Timeline.Send')}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingEntry !== null}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('Timeline.EditDialogTitle', { defaultValue: 'Edit entry' })}
            </DialogTitle>
            <DialogDescription>
              {t('Timeline.EditDialogHint', {
                defaultValue: 'You can edit your own entries within 15 minutes of posting.',
              })}
            </DialogDescription>
          </DialogHeader>
          {/* `key` forces remount when switching between entries so the */}
          {/* composer's internal body state is re-seeded from `initialBody`. */}
          <TimelineComposer
            key={editingEntry?.id ?? 'edit'}
            onSubmit={handleEditSubmit}
            initialBody={editingEntry?.originalBody}
            initialEntryType={editingEntry?.originalEntryType}
            entryTypes={entryTypes}
            searchMentions={searchMentions}
            placeholder={t('Timeline.AddComment')}
            submitLabel={t('Timeline.SaveEdit', { defaultValue: 'Save' })}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * Entity timeline component. Requires a `<TimelineProvider>` ancestor
 * (both App.tsx files mount one at the app level via `timelineConfig`).
 */
export function EntityTimeline(props: Readonly<EntityTimelineProps>) {
  return <EntityTimelineInner {...props} />;
}
