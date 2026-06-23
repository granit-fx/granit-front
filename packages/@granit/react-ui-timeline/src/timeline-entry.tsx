import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useAnchorEntry, useToggleReaction } from '@granit/react-timeline';
import { Button, Avatar, AvatarFallback } from '@granit/react-ui';
import { TimelineEntryOrigin, TimelineEntryType } from '@granit/timeline';
import { cn } from '@granit/utils';
import { useCallback, useMemo } from 'react';

import { ReactionStrip } from './reaction-strip';

import type {
  ReactionEmoji,
  ReactionToggleResponse,
  TimelineStreamEntryResponse,
  TimelineEntryId,
} from '@granit/timeline';

export interface TimelineEntryProps {
  entry: TimelineStreamEntryResponse;
  /**
   * Surrounding stream's entity context. Required for reactions
   * (`useToggleReaction` scopes its optimistic patches by stream).
   * Optional only to keep legacy non-reaction usages compatible.
   */
  entityType?: string;
  entityId?: string;
  /**
   * Whether the viewer holds the `Timeline.Reactions.React` permission. Hosts read
   * this from their auth provider and pass it down — keeps `TimelineStreamEntryResponse`
   * QueryClient-free so it can be unit-tested without mounting the
   * authorization stack. Defaults to `false` (read-only reactions).
   */
  canReact?: boolean;
  depth?: number;
  onReply?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
  /**
   * Invoked when the user clicks "Edit". When omitted, the action is
   * not rendered. Hosts compute eligibility (native origin + Comment
   * or InternalNote + authorship + within edit window) and only pass
   * this callback for entries the current user can actually edit. The
   * callback receives the current body so the host can pre-fill its
   * editor; the host owns the form lifecycle.
   */
  onEdit?: (
    entryId: TimelineEntryId,
    currentBody: string,
    entryType: TimelineStreamEntryResponse['entryType']
  ) => void;
  /**
   * Invoked with the server's authoritative result after a reaction
   * toggle resolves. Hosts wire this to `useTimeline().patchEntry`
   * (via {@link applyToggleResult}) so only the affected entry's
   * `reactions` map updates — no full stream refetch. `useTimeline`
   * keeps entries in `useState` (not React Query), so the toggle
   * hook's React Query cache patches don't reach this consumer.
   */
  onReactionToggled?: (entryId: TimelineEntryId, result: ReactionToggleResponse) => void;
  renderBody?: (body: string) => React.ReactNode;
  className?: string;
}

const ENTRY_TYPE_LABELS: Record<TimelineEntryType, string> = {
  [TimelineEntryType.Comment]: 'comment',
  [TimelineEntryType.InternalNote]: 'internal-note',
  [TimelineEntryType.SystemLog]: 'system-log',
};

/* Closed palette of semantic tokens used for avatar tinting. CLAUDE.md
 * forbids raw color utilities outside `components/ui/`, so we pick from
 * four neutral-friendly slots and hash the authorId into one of them
 * for a deterministic but varied result. */
const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
  'bg-muted text-muted-foreground',
] as const;

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  const last = parts.at(-1) ?? '';
  return (parts[0]!.charAt(0) + last.charAt(0)).toUpperCase();
}

function getAvatarTintClass(authorId: string | null | undefined): string {
  if (!authorId) return AVATAR_PALETTE[3];
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = Math.trunc(hash * 31 + (authorId.codePointAt(i) ?? 0));
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!;
}

export function TimelineEntry({
  entry,
  entityType,
  entityId,
  canReact = false,
  depth = 0,
  onReply,
  onDelete,
  onEdit,
  onReactionToggled,
  renderBody,
  className,
}: Readonly<TimelineEntryProps>) {
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  const { t } = useTranslation();
  const reactionsEnabled = canReact && Boolean(entityType && entityId);
  const handleReply = useCallback(() => {
    onReply?.(entry.id);
  }, [onReply, entry.id]);

  const handleDelete = useCallback(() => {
    onDelete?.(entry.id);
  }, [onDelete, entry.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(entry.id, entry.body, entry.entryType);
  }, [onEdit, entry.id, entry.body, entry.entryType]);

  const entryTypeClass = ENTRY_TYPE_LABELS[entry.entryType] ?? 'unknown';
  const isSystemLog = entry.entryType === TimelineEntryType.SystemLog;
  const initials = useMemo(() => getInitials(entry.authorName), [entry.authorName]);
  const avatarTint = useMemo(() => getAvatarTintClass(entry.authorId), [entry.authorId]);

  return (
    <article
      className={cn('flex gap-3', className)}
      data-testid="timeline-entry"
      data-entry-type={entryTypeClass}
      data-depth={depth}
      style={depth > 0 ? { marginLeft: `${depth * 24}px` } : undefined}
      aria-label={`${entryTypeClass} by ${entry.authorName}`}
    >
      <Avatar size="sm" aria-hidden="true" data-testid="timeline-entry-avatar">
        <AvatarFallback className={cn('text-xs font-semibold', avatarTint)}>
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <header
          data-testid="timeline-entry-header"
          className="flex flex-wrap items-baseline gap-x-2 text-sm"
        >
          <span data-testid="timeline-entry-author" className="font-medium text-foreground">
            {entry.authorName ?? 'System'}
          </span>
          <time
            dateTime={entry.occurredAt}
            title={formatDateTime(entry.occurredAt)}
            data-testid="timeline-entry-time"
            className="text-xs text-muted-foreground"
          >
            {formatTimeAgo(entry.occurredAt)}
          </time>
          {entry.editedAt ? (
            <span
              data-testid="timeline-entry-edited-badge"
              title={`${t('Timeline.Edited', { defaultValue: 'Edited' })}: ${formatDateTime(entry.editedAt)}`}
              className="text-xs italic text-muted-foreground"
            >
              ({t('Timeline.EditedShort', { defaultValue: 'edited' })})
            </span>
          ) : null}
        </header>

        <div data-testid="timeline-entry-body" className="mt-1 text-sm text-foreground">
          {renderBody ? renderBody(entry.body) : entry.body}
        </div>

        {!isSystemLog &&
          (reactionsEnabled && entityType && entityId ? (
            <InteractiveReactionBar
              entry={entry}
              entityType={entityType}
              entityId={entityId}
              onToggled={onReactionToggled}
            />
          ) : (
            <ReactionStrip
              entryId={entry.id}
              reactions={entry.reactions ?? undefined}
              className="mt-1"
            />
          ))}

        {!isSystemLog && (
          <footer data-testid="timeline-entry-actions" className="mt-1 flex items-center gap-1">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReply}
                data-testid="timeline-reply-btn"
              >
                {t('Timeline.Reply', { defaultValue: 'Reply' })}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                data-testid="timeline-edit-btn"
              >
                {t('Timeline.Edit', { defaultValue: 'Edit' })}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                data-testid="timeline-delete-btn"
              >
                {t('Timeline.Delete', { defaultValue: 'Delete' })}
              </Button>
            )}
          </footer>
        )}
      </div>
    </article>
  );
}

// Sub-component that owns the `useToggleReaction` hook (and thus the
// `useMutation` → `useQueryClient` chain). Mounting it conditionally
// keeps the parent `<TimelineEntry>` mountable without a
// `<QueryClientProvider>` for any non-reacting scenario (read-only
// users, unit tests, stories without auth wiring).
interface InteractiveReactionBarProps {
  readonly entry: TimelineStreamEntryResponse;
  readonly entityType: string;
  readonly entityId: string;
  readonly onToggled?: (entryId: TimelineEntryId, result: ReactionToggleResponse) => void;
}

function InteractiveReactionBar({
  entry,
  entityType,
  entityId,
  onToggled,
}: InteractiveReactionBarProps) {
  const toggleReaction = useToggleReaction();
  const anchorEntry = useAnchorEntry();
  const needsAnchor =
    (entry.origin ?? TimelineEntryOrigin.Native) === TimelineEntryOrigin.External &&
    typeof entry.sourceKey === 'string' &&
    entry.sourceKey.length > 0 &&
    typeof entry.sourceId === 'string' &&
    entry.sourceId.length > 0;

  const handleToggle = useCallback(
    ({ entryId, emoji }: { entryId: TimelineEntryId; emoji: ReactionEmoji }) => {
      // For external-origin entries the reaction endpoint only accepts
      // the native shadow id, so we materialise (or recover) it first
      // via the deterministic v5 anchor — idempotent, repeated clicks
      // converge on the same id. The local cache is patched against
      // the *original* (projected) entryId so the visible row updates;
      // a subsequent stream refresh will swap the id to the shadow.
      const cascade = async () => {
        const sourceKey = entry.sourceKey;
        const sourceId = entry.sourceId;
        const targetId =
          needsAnchor && sourceKey && sourceId
            ? await anchorEntry.mutateAsync({ entityType, entityId, sourceKey, sourceId })
            : entryId;
        toggleReaction.mutate(
          { entityType, entityId, entryId: targetId, emoji },
          { onSuccess: (result) => onToggled?.(entryId, result) }
        );
      };
      void cascade();
    },
    [
      toggleReaction,
      anchorEntry,
      entityType,
      entityId,
      needsAnchor,
      entry.sourceKey,
      entry.sourceId,
      onToggled,
    ]
  );
  return (
    <ReactionStrip
      entryId={entry.id}
      reactions={entry.reactions ?? undefined}
      onToggle={handleToggle}
      className="mt-1"
    />
  );
}
