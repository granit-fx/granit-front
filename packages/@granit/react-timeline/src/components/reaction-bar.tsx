import { type ReactionEmoji, type ReactionMap } from '@granit/timeline';
import { type ReactNode } from 'react';

import type { TimelineEntryId } from '@granit/timeline';

export interface ReactionBarLabels {
  /**
   * Aria label for one reaction button. Receives the emoji glyph so apps
   * can localize via `t('timeline:Reaction.AriaLabel', { emoji })`.
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
   * straight from the stream payload. The bar renders one button per
   * present emoji. An entry with no reactions renders nothing.
   */
  readonly reactions: ReactionMap | undefined;
  /**
   * Click handler. When `undefined`, the bar renders as a read-only
   * tally — present buttons disabled, no toggle. Apps gate by the
   * `Timeline.Reactions.React` permission via this callback's presence.
   */
  readonly onToggle?: (args: { entryId: TimelineEntryId; emoji: ReactionEmoji }) => void;
  /** Override the English defaults for aria labels (i18n in C4). */
  readonly labels?: ReactionBarLabels;
  readonly className?: string;
}

/**
 * Headless tally of reactions on one entry — one button per emoji
 * currently present in `entry.reactions`, with `aria-pressed` reflecting
 * the caller's `byCurrentUser` state. The glyph is rendered as plain
 * text inside `<span data-granit-reaction-bar-emoji>`; apps style it
 * (CSS pseudo-elements, native font, an `<img>` overlay…) by selecting
 * on `data-emoji`.
 *
 * **Adding a new reaction is strictly the consumer's responsibility.**
 * Each product owns its own picker UX (a third-party picker library,
 * a static palette, a keyboard shortcut, …) and feeds the chosen glyph
 * back through `onToggle({ entryId, emoji: parseReactionEmoji(picked)! })`.
 * The framework stays neutral on emoji rendering and picker chrome so
 * apps with different design systems, CSP policies, and bundle budgets
 * can each pick their own.
 *
 * Apps wire `onToggle` to `useToggleReaction()` from this package (the
 * hook handles optimistic + rollback against the React Query cache when
 * present).
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

  const present = Object.entries(reactions ?? {}) as unknown as readonly [
    ReactionEmoji,
    { count: number; byCurrentUser: boolean },
  ][];

  return (
    <div
      data-granit-reaction-bar=""
      data-entry-id={entryId}
      data-readonly={isInteractive ? undefined : ''}
      role="toolbar"
      className={className}
    >
      {present.map(([emoji, aggregate]) => {
        const hasReacted = aggregate.byCurrentUser;
        return (
          <button
            key={emoji}
            type="button"
            data-granit-reaction-bar-button=""
            data-emoji={emoji}
            data-count={aggregate.count}
            data-has-reacted={hasReacted ? '' : undefined}
            aria-pressed={hasReacted}
            aria-label={merged.buttonAriaLabel(emoji)}
            disabled={!isInteractive}
            onClick={isInteractive ? () => onToggle({ entryId, emoji }) : undefined}
          >
            <span data-granit-reaction-bar-emoji="">{emoji}</span>
            <span data-granit-reaction-bar-count="">{aggregate.count}</span>
          </button>
        );
      })}
    </div>
  );
}
