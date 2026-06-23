import { useTranslation } from '@granit/react-localization';
import { Popover, PopoverContent, PopoverTrigger } from '@granit/react-ui';
import {
  parseReactionEmoji,
  type ReactionAggregateResponse,
  type ReactionEmoji,
  type ReactionMap,
  type TimelineEntryId,
} from '@granit/timeline';
import { cn } from '@granit/utils';
import { SmilePlus } from 'lucide-react';
import * as React from 'react';

import { EmojiPicker } from './emoji-picker';
import { TwemojiImage } from './twemoji-image';

export interface ReactionStripProps {
  readonly entryId: TimelineEntryId;
  readonly reactions: ReactionMap | undefined;
  /** Toggle handler. When undefined, the strip renders read-only (no picker, no chip clicks). */
  readonly onToggle?: (args: { entryId: TimelineEntryId; emoji: ReactionEmoji }) => void;
  readonly className?: string;
}

// Teams / Slack-style reaction strip:
//  - chips render only emojis present in `entry.reactions` (count > 0),
//    keyed by literal Unicode grapheme (👍, 👍🏽, 👨‍👩‍👧, …),
//  - glyphs use `<TwemojiImage>` for cross-OS-consistent rendering,
//  - a discrete `<SmilePlus />` button opens an `<EmojiPicker>` popover
//    backed by emoji-mart (full Unicode catalog, lazy-loaded),
//  - read-only viewers (no `onToggle`) see no picker and chips are
//    non-clickable; the whole strip is hidden when reactions are empty.
export function ReactionStrip({ entryId, reactions, onToggle, className }: ReactionStripProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const isInteractive = onToggle != null;

  const present = Object.entries(reactions ?? {}) as readonly [string, ReactionAggregateResponse][];

  if (present.length === 0 && !isInteractive) return null;

  const handlePick = (native: string) => {
    setPickerOpen(false);
    const branded = parseReactionEmoji(native);
    if (!branded || !onToggle) return;
    onToggle({ entryId, emoji: branded });
  };

  return (
    <div
      data-slot="reaction-strip"
      data-granit-reaction-strip=""
      data-entry-id={entryId}
      className={cn('flex flex-wrap items-center gap-1', className)}
    >
      {present.map(([emoji, aggregate]) => {
        const hasReacted = aggregate.byCurrentUser;
        return (
          <button
            key={emoji}
            type="button"
            data-emoji={emoji}
            data-has-reacted={hasReacted ? '' : undefined}
            aria-pressed={hasReacted}
            aria-label={t('Timeline.Reaction.AriaLabel', {
              defaultValue: `React with {{emoji}}`,
              emoji: aggregate.displayEmoji,
            })}
            disabled={!isInteractive}
            onClick={
              isInteractive
                ? () => {
                    const branded = parseReactionEmoji(emoji);
                    if (branded) onToggle({ entryId, emoji: branded });
                  }
                : undefined
            }
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs transition-colors',
              hasReacted
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
              !isInteractive && 'cursor-default opacity-80'
            )}
          >
            <TwemojiImage emoji={aggregate.displayEmoji} size={14} />
            <span className="font-medium tabular-nums">{aggregate.count}</span>
          </button>
        );
      })}

      {isInteractive && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-granit-reaction-strip-picker=""
              aria-label={t('Timeline.AddReaction', { defaultValue: 'Add reaction' })}
              title={t('Timeline.AddReaction', { defaultValue: 'Add reaction' })}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <SmilePlus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-auto border-0 bg-transparent p-0 shadow-none"
          >
            <EmojiPicker onSelect={handlePick} onClose={() => setPickerOpen(false)} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
