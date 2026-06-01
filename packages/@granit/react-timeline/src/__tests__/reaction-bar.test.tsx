import { toReactionEmoji } from '@granit/timeline';
import { toEntityId } from '@granit/types';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReactionBar } from '../components/reaction-bar';

import type { ReactionMap, TimelineEntryId } from '@granit/timeline';

const ENTRY_ID = toEntityId<'TimelineEntry'>('e-42') as TimelineEntryId;
const THUMBS_UP = toReactionEmoji('👍');
const HEART = toReactionEmoji('❤️');

function buttonFor(container: HTMLElement, emoji: string): HTMLButtonElement {
  const buttons = container.querySelectorAll<HTMLButtonElement>(
    '[data-granit-reaction-bar-button]'
  );
  for (const btn of buttons) {
    if (btn.getAttribute('data-emoji') === emoji) return btn;
  }
  throw new Error(`No reaction button found for emoji ${emoji}`);
}

describe('<ReactionBar>', () => {
  it('renders one button per present reaction — no closed catalog anymore', () => {
    const reactions: ReactionMap = {
      [THUMBS_UP]: { count: 5, byCurrentUser: true },
      [HEART]: { count: 2, byCurrentUser: false },
    };
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={reactions} onToggle={vi.fn()} />
    );

    const buttons = container.querySelectorAll('[data-granit-reaction-bar-button]');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute('data-emoji')).toBe(THUMBS_UP);
    expect(buttons[1]?.getAttribute('data-emoji')).toBe(HEART);
  });

  it('renders zero buttons when reactions is empty or undefined', () => {
    const { container, rerender } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={undefined} onToggle={vi.fn()} />
    );
    expect(container.querySelectorAll('[data-granit-reaction-bar-button]')).toHaveLength(0);

    rerender(<ReactionBar entryId={ENTRY_ID} reactions={{}} onToggle={vi.fn()} />);
    expect(container.querySelectorAll('[data-granit-reaction-bar-button]')).toHaveLength(0);
  });

  it('does not render an "add reaction" trigger — picker UX is the consumer\'s job', () => {
    const reactions: ReactionMap = { [THUMBS_UP]: { count: 1, byCurrentUser: true } };
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={reactions} onToggle={vi.fn()} />
    );

    expect(container.querySelector('[data-granit-reaction-bar-add]')).toBeNull();
    expect(container.querySelectorAll('[data-granit-reaction-bar-button]')).toHaveLength(1);
  });

  it('renders the emoji glyph as plain text inside <span data-granit-reaction-bar-emoji>', () => {
    const reactions: ReactionMap = { [THUMBS_UP]: { count: 3, byCurrentUser: false } };
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={reactions} onToggle={vi.fn()} />
    );

    const span = buttonFor(container, THUMBS_UP).querySelector(
      'span[data-granit-reaction-bar-emoji]'
    );
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe(THUMBS_UP);
    expect(span?.querySelector('img')).toBeNull();
  });

  it('reflects per-emoji count + aria-pressed from the reactions prop', () => {
    const reactions: ReactionMap = {
      [THUMBS_UP]: { count: 5, byCurrentUser: true },
      [HEART]: { count: 2, byCurrentUser: false },
    };
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={reactions} onToggle={vi.fn()} />
    );

    const thumbs = buttonFor(container, THUMBS_UP);
    expect(thumbs.getAttribute('aria-pressed')).toBe('true');
    expect(thumbs.getAttribute('data-count')).toBe('5');
    expect(thumbs.getAttribute('data-has-reacted')).toBe('');

    const heart = buttonFor(container, HEART);
    expect(heart.getAttribute('aria-pressed')).toBe('false');
    expect(heart.getAttribute('data-count')).toBe('2');
    expect(heart.getAttribute('data-has-reacted')).toBeNull();
  });

  it('fires onToggle with { entryId, emoji } when an existing reaction is clicked', () => {
    const reactions: ReactionMap = { [THUMBS_UP]: { count: 1, byCurrentUser: true } };
    const onToggle = vi.fn();
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={reactions} onToggle={onToggle} />
    );

    fireEvent.click(buttonFor(container, THUMBS_UP));

    expect(onToggle).toHaveBeenCalledExactlyOnceWith({ entryId: ENTRY_ID, emoji: THUMBS_UP });
  });

  it('renders read-only — present buttons disabled, no onToggle firing — when callback is omitted', () => {
    const reactions: ReactionMap = { [THUMBS_UP]: { count: 1, byCurrentUser: false } };
    const { container } = render(<ReactionBar entryId={ENTRY_ID} reactions={reactions} />);

    const root = container.querySelector('[data-granit-reaction-bar]') as HTMLElement;
    expect(root.getAttribute('data-readonly')).toBe('');
    expect(buttonFor(container, THUMBS_UP).disabled).toBe(true);
  });

  it('uses the buttonAriaLabel override when supplied', () => {
    const reactions: ReactionMap = { [THUMBS_UP]: { count: 1, byCurrentUser: true } };
    const { container } = render(
      <ReactionBar
        entryId={ENTRY_ID}
        reactions={reactions}
        onToggle={vi.fn()}
        labels={{ buttonAriaLabel: (emoji) => `Réagir avec ${emoji}` }}
      />
    );

    expect(buttonFor(container, THUMBS_UP).getAttribute('aria-label')).toBe(
      `Réagir avec ${THUMBS_UP}`
    );
  });

  it('exposes the entry id on the root for app-level styling / instrumentation', () => {
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={undefined} onToggle={vi.fn()} />
    );
    const root = container.querySelector('[data-granit-reaction-bar]') as HTMLElement;
    expect(root.getAttribute('data-entry-id')).toBe(ENTRY_ID);
  });
});
