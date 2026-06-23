import { useTranslation } from '@granit/react-localization';
import { Button, Spinner } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { useCallback, useMemo } from 'react';

import { TimelineEntry } from './timeline-entry.js';

import type { TimelineEntryProps } from './timeline-entry.js';
import type {
  ReactionToggleResponse,
  TimelineStreamEntryResponse as TimelineEntryType,
  TimelineEntryId,
} from '@granit/timeline';

export interface TimelineStreamProps {
  entries: readonly TimelineEntryType[];
  /**
   * Stream's entity context — threaded into each `<TimelineEntry>` so
   * reactions (`useToggleReaction`) can scope their cache patches by
   * stream.
   */
  entityType?: string;
  entityId?: string;
  /** Forwarded to each `<TimelineEntry>` — gates the reaction bar's interactive mode. */
  canReact?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReply?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
  /** Forwarded to each entry — see {@link TimelineEntryProps.onEdit}. */
  onEdit?: (
    entryId: TimelineEntryId,
    currentBody: string,
    entryType: TimelineEntryType['entryType']
  ) => void;
  /**
   * Per-entry edit eligibility predicate. When provided, the stream
   * only forwards {@link onEdit} to entries for which `canEdit(entry)`
   * returns true — others render no edit action. Without a predicate,
   * `onEdit` (if present) is forwarded to every entry. Hosts typically
   * encode the four edit gates here (native origin, type, authorship,
   * within edit window) so the button only shows for actionable rows.
   */
  canEdit?: (entry: TimelineEntryType) => boolean;
  /** Forwarded to each interactive reaction bar — see TimelineEntryProps. */
  onReactionToggled?: (entryId: TimelineEntryId, result: ReactionToggleResponse) => void;
  renderEntry?: (props: TimelineEntryProps) => React.ReactNode;
  renderBody?: (body: string) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

interface ThreadedEntry {
  entry: TimelineEntryType;
  depth: number;
}

function buildThreadedList(entries: readonly TimelineEntryType[]): ThreadedEntry[] {
  const rootEntries: TimelineEntryType[] = [];
  const childrenMap = new Map<string, TimelineEntryType[]>();

  for (const entry of entries) {
    if (entry.parentEntryId) {
      const siblings = childrenMap.get(entry.parentEntryId) ?? [];
      siblings.push(entry);
      childrenMap.set(entry.parentEntryId, siblings);
    } else {
      rootEntries.push(entry);
    }
  }

  const result: ThreadedEntry[] = [];

  function addWithChildren(entry: TimelineEntryType, depth: number) {
    result.push({ entry, depth });
    const children = childrenMap.get(entry.id);
    if (children) {
      for (const child of children) {
        addWithChildren(child, depth + 1);
      }
    }
  }

  for (const root of rootEntries) {
    addWithChildren(root, 0);
  }

  return result;
}

export function TimelineStream({
  entries,
  entityType,
  entityId,
  canReact = false,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onDelete,
  onEdit,
  canEdit,
  onReactionToggled,
  renderEntry,
  renderBody,
  className,
  emptyMessage = 'No entries yet.',
}: Readonly<TimelineStreamProps>) {
  const { t } = useTranslation();
  const threadedEntries = useMemo(() => buildThreadedList(entries), [entries]);

  const handleLoadMore = useCallback(() => {
    onLoadMore?.();
  }, [onLoadMore]);

  if (loading) {
    return (
      <output className={className} aria-label="Loading timeline">
        <Spinner data-testid="timeline-loading" />
      </output>
    );
  }

  if (threadedEntries.length === 0) {
    return (
      <div className={className} data-testid="timeline-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section
      className={cn('space-y-4', className)}
      aria-label="Timeline"
      data-testid="timeline-stream"
    >
      {threadedEntries.map(({ entry, depth }) => {
        const entryProps: TimelineEntryProps = {
          entry,
          entityType,
          entityId,
          canReact,
          depth,
          onReply,
          onDelete,
          onEdit: onEdit && (!canEdit || canEdit(entry)) ? onEdit : undefined,
          onReactionToggled,
          renderBody,
        };

        return renderEntry ? (
          <div key={entry.id}>{renderEntry(entryProps)}</div>
        ) : (
          <TimelineEntry key={entry.id} {...entryProps} />
        );
      })}

      {hasMore && (
        <div data-testid="timeline-load-more">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
            data-testid="timeline-load-more-btn"
          >
            {loadingMore
              ? t('Timeline.LoadingMore', { defaultValue: 'Loading…' })
              : t('Timeline.LoadMore', { defaultValue: 'Load more' })}
          </Button>
        </div>
      )}
    </section>
  );
}
