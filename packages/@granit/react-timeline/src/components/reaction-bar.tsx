import {
  REACTION_EMOJIS,
  type ReactionEmoji,
  type ReactionMap,
  type TimelineEntryId,
} from '@granit/timeline';
import { type ReactNode } from 'react';

export interface ReactionBarLabels {
  /**
   * Aria label for one reaction button. Receives the emoji code so apps
   * can localize per emoji via
   * `t('timeline:Reaction.AriaLabel.' + emoji)`.
   */
  readonly buttonAriaLabel?: (emoji: ReactionEmoji) => string;
}

const DEFAULT_LABELS: Required<ReactionBarLabels> = {
  buttonAriaLabel: (emoji) => `React with ${emoji}`,
};

export interface ReactionBarProps {
  /** Id of the entry this bar belongs to — passed to the toggle callback. */
  readonly entryId: TimelineEntryId;
  /**
   * Current reactions for the entry — typically `entry.reactions`
   * straight from the stream payload. Missing emojis render as
   * `count=0, byCurrentUser=false` so the bar always shows the full
   * closed catalog.
   */
  readonly reactions: ReactionMap | undefined;
  /**
   * Click handler. When `undefined`, the bar renders as a read-only
   * tally — buttons disabled, no toggle. Apps gate by the
   * `Timeline.Reactions.React` permission via this callback's presence.
   */
  readonly onToggle?: (args: { entryId: TimelineEntryId; emoji: ReactionEmoji }) => void;
  /** Override the English defaults for aria labels (i18n in C4). */
  readonly labels?: ReactionBarLabels;
  readonly className?: string;
}

/**
 * Headless reaction picker — five buttons (the closed v1 catalog from
 * `@granit/timeline`) with per-button count and `aria-pressed`
 * reflecting the caller's `hasReacted` state.
 *
 * Visual chrome (emoji glyph rendering, theme tokens, hover/focus
 * styling) is the consuming app's responsibility — the bar exposes
 * `data-emoji` / `data-granit-reaction-bar-*` markers and renders the
 * raw `:short_name:` codes by default. Apps can swap to Twemoji or
 * native via CSS pseudo-elements keyed on `data-emoji`.
 *
 * Apps wire `onToggle` to `useToggleReaction()` from this package
 * (the hook handles optimistic + rollback against the React Query
 * cache when present).
 */
export function ReactionBar({
  entryId,
  reactions,
  onToggle,
  labels,
  className,
}: ReactionBarProps): ReactNode {
  const merged = { ...DEFAULT_LABELS, ...labels };
  const isInteractive = onToggle != null;

  return (
    <div
      data-granit-reaction-bar=""
      data-entry-id={entryId}
      data-readonly={isInteractive ? undefined : ''}
      role="group"
      className={className}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const aggregate = reactions?.[emoji];
        const count = aggregate?.count ?? 0;
        const hasReacted = aggregate?.byCurrentUser ?? false;
        return (
          <button
            key={emoji}
            type="button"
            data-granit-reaction-bar-button=""
            data-emoji={emoji}
            data-count={count}
            data-has-reacted={hasReacted ? '' : undefined}
            aria-pressed={hasReacted}
            aria-label={merged.buttonAriaLabel(emoji)}
            disabled={!isInteractive}
            onClick={isInteractive ? () => onToggle({ entryId, emoji }) : undefined}
          >
            <span data-granit-reaction-bar-emoji="">{emoji}</span>
            {count > 0 ? <span data-granit-reaction-bar-count="">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
