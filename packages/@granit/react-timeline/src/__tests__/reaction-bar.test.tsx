import { REACTION_EMOJIS } from '@granit/timeline';
import { toEntityId } from '@granit/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReactionBar } from '../components/reaction-bar.js';

import type { Reaction, TimelineEntryId } from '@granit/timeline';

const ENTRY_ID = toEntityId<'TimelineEntry'>('e-42') as TimelineEntryId;

describe('<ReactionBar>', () => {
  it('renders the full closed catalog (5 buttons, regardless of input shape)', () => {
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={[]} onToggle={vi.fn()} />
    );

    const buttons = container.querySelectorAll('[data-granit-reaction-bar-button]');
    expect(buttons).toHaveLength(REACTION_EMOJIS.length);
    REACTION_EMOJIS.forEach((emoji, i) => {
      expect(buttons[i]?.getAttribute('data-emoji')).toBe(emoji);
    });
  });

  it('reflects per-emoji count and aria-pressed from the reactions prop', () => {
    const reactions: Reaction[] = [
      { emoji: ':thumbs_up:', count: 5, hasReacted: true },
      { emoji: ':eyes:', count: 2, hasReacted: false },
    ];
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={reactions} onToggle={vi.fn()} />
    );

    const thumbs = container.querySelector('[data-emoji=":thumbs_up:"]') as HTMLElement;
    expect(thumbs.getAttribute('aria-pressed')).toBe('true');
    expect(thumbs.getAttribute('data-count')).toBe('5');
    expect(thumbs.getAttribute('data-has-reacted')).toBe('');

    const eyes = container.querySelector('[data-emoji=":eyes:"]') as HTMLElement;
    expect(eyes.getAttribute('aria-pressed')).toBe('false');
    expect(eyes.getAttribute('data-count')).toBe('2');
    expect(eyes.getAttribute('data-has-reacted')).toBeNull();

    const unused = container.querySelector('[data-emoji=":heart:"]') as HTMLElement;
    expect(unused.getAttribute('data-count')).toBe('0');
    expect(unused.getAttribute('aria-pressed')).toBe('false');
  });

  it('hides the count badge when count is zero', () => {
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={[]} onToggle={vi.fn()} />
    );

    expect(container.querySelectorAll('[data-granit-reaction-bar-count]')).toHaveLength(0);
  });

  it('fires onToggle with { entryId, emoji } when a button is clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={[]} onToggle={onToggle} />
    );

    fireEvent.click(container.querySelector('[data-emoji=":tada:"]') as HTMLElement);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith({ entryId: ENTRY_ID, emoji: ':tada:' });
  });

  it('renders read-only when no onToggle callback is provided (permission gating)', () => {
    const { container } = render(<ReactionBar entryId={ENTRY_ID} reactions={[]} />);

    const root = container.querySelector('[data-granit-reaction-bar]') as HTMLElement;
    expect(root.getAttribute('data-readonly')).toBe('');

    container.querySelectorAll('button').forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });

    // Counts still render — it's a read-only tally
    fireEvent.click(container.querySelector('[data-emoji=":heart:"]') as HTMLElement);
    // No assertion needed — disabled buttons emit no click event by default
  });

  it('uses the buttonAriaLabel override when supplied', () => {
    render(
      <ReactionBar
        entryId={ENTRY_ID}
        reactions={[]}
        onToggle={vi.fn()}
        labels={{
          buttonAriaLabel: (emoji) => `Réagir avec ${emoji}`,
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Réagir avec :thumbs_up:' })).toBeDefined();
  });

  it('exposes the entry id on the root for app-level styling / instrumentation', () => {
    const { container } = render(
      <ReactionBar entryId={ENTRY_ID} reactions={[]} onToggle={vi.fn()} />
    );
    const root = container.querySelector('[data-granit-reaction-bar]') as HTMLElement;
    expect(root.getAttribute('data-entry-id')).toBe(ENTRY_ID);
  });
});
