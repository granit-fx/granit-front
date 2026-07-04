import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ReactionStrip } from './reaction-strip';

import type { EmojiPickerProps } from './emoji-picker';
import type { ReactionMap, TimelineEntryId } from '@granit/timeline';

// Replace the emoji-mart-backed picker (lazy chunk + next-themes) with a
// synchronous stand-in that exposes the `onSelect` / `onClose` callbacks as
// buttons — this drives `handlePick`'s branches deterministically.
vi.mock('./emoji-picker', () => ({
  EmojiPicker: ({ onSelect, onClose }: EmojiPickerProps) => (
    <div data-testid="mock-emoji-picker">
      <button type="button" data-testid="pick-valid" onClick={() => onSelect('🎉')}>
        valid
      </button>
      <button type="button" data-testid="pick-invalid" onClick={() => onSelect('not-emoji')}>
        invalid
      </button>
      <button type="button" data-testid="pick-close" onClick={() => onClose?.()}>
        close
      </button>
    </div>
  ),
}));

// Radix Popover relies on Pointer Events APIs jsdom doesn't implement.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => undefined;
    Element.prototype.releasePointerCapture = () => undefined;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

const ENTRY_ID = '8c6b1e10-0000-4000-8000-000000000001' as TimelineEntryId;

function reactionMap(
  entries: Record<string, { count: number; byCurrentUser: boolean; displayEmoji: string }>
): ReactionMap {
  return entries as ReactionMap;
}

// jsdom's nwsapi selector engine can't match astral-plane emoji inside an
// attribute-value selector, so resolve chips by iterating + getAttribute.
function chip(root: ParentNode, emoji: string): HTMLButtonElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-emoji]')).find(
      (b) => b.getAttribute('data-emoji') === emoji
    ) ?? null
  );
}

describe('ReactionStrip', () => {
  it('renders nothing when read-only and there are no reactions', () => {
    const { container } = render(<ReactionStrip entryId={ENTRY_ID} reactions={{}} />);
    expect(container.querySelector('[data-slot="reaction-strip"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when read-only and reactions is undefined', () => {
    const { container } = render(<ReactionStrip entryId={ENTRY_ID} reactions={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('exposes the entry id and merges the className on the root', () => {
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({ '👍': { count: 1, byCurrentUser: false, displayEmoji: '👍' } })}
        className="mt-2"
      />
    );
    const root = container.querySelector('[data-slot="reaction-strip"]') as HTMLElement;
    expect(root.getAttribute('data-entry-id')).toBe(ENTRY_ID);
    expect(root.hasAttribute('data-granit-reaction-strip')).toBe(true);
    expect(root.className).toContain('mt-2');
  });

  it('renders a chip per reaction with count and display emoji', () => {
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({
          '👍': { count: 3, byCurrentUser: false, displayEmoji: '👍' },
          '❤️': { count: 7, byCurrentUser: false, displayEmoji: '❤️' },
        })}
      />
    );
    const chips = container.querySelectorAll('button[data-emoji]');
    expect(chips).toHaveLength(2);
    const thumbs = chip(container, '👍');
    expect(thumbs?.querySelector('span')?.textContent).toBe('3');
    expect(thumbs?.querySelector('img')?.getAttribute('alt')).toBe('👍');
  });

  it('reflects byCurrentUser via aria-pressed and the data-has-reacted marker', () => {
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({
          '👍': { count: 1, byCurrentUser: true, displayEmoji: '👍' },
          '😀': { count: 1, byCurrentUser: false, displayEmoji: '😀' },
        })}
      />
    );
    const reacted = chip(container, '👍');
    const notReacted = chip(container, '😀');
    expect(reacted?.getAttribute('aria-pressed')).toBe('true');
    expect(reacted?.hasAttribute('data-has-reacted')).toBe(true);
    expect(notReacted?.getAttribute('aria-pressed')).toBe('false');
    expect(notReacted?.hasAttribute('data-has-reacted')).toBe(false);
  });

  it('renders read-only chips as disabled with no picker button', () => {
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({ '👍': { count: 1, byCurrentUser: false, displayEmoji: '👍' } })}
      />
    );
    const thumbs = chip(container, '👍');
    expect(thumbs?.disabled).toBe(true);
    expect(thumbs?.className).toContain('cursor-default');
    expect(container.querySelector('[data-granit-reaction-strip-picker]')).toBeNull();
  });

  it('does not fire onToggle when a read-only chip is clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({ '👍': { count: 1, byCurrentUser: false, displayEmoji: '👍' } })}
      />
    );
    fireEvent.click(chip(container, '👍') as HTMLElement);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders the picker (and no chips) when interactive with empty reactions', () => {
    const { container } = render(
      <ReactionStrip entryId={ENTRY_ID} reactions={{}} onToggle={vi.fn()} />
    );
    expect(container.querySelector('[data-slot="reaction-strip"]')).not.toBeNull();
    expect(container.querySelector('button[data-emoji]')).toBeNull();
    expect(container.querySelector('[data-granit-reaction-strip-picker]')).not.toBeNull();
  });

  it('fires onToggle with the branded emoji when an interactive chip is clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({ '👍': { count: 1, byCurrentUser: false, displayEmoji: '👍' } })}
        onToggle={onToggle}
      />
    );
    const thumbs = chip(container, '👍');
    expect(thumbs?.disabled).toBe(false);
    fireEvent.click(thumbs as HTMLElement);
    expect(onToggle).toHaveBeenCalledWith({ entryId: ENTRY_ID, emoji: '👍' });
  });

  it('swallows the click when the chip key is not a valid emoji', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ReactionStrip
        entryId={ENTRY_ID}
        reactions={reactionMap({ x: { count: 1, byCurrentUser: false, displayEmoji: 'x' } })}
        onToggle={onToggle}
      />
    );
    fireEvent.click(chip(container, 'x') as HTMLElement);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('toggles the reaction picked from the popover and closes it', async () => {
    const onToggle = vi.fn();
    const { container, getByTestId } = render(
      <ReactionStrip entryId={ENTRY_ID} reactions={{}} onToggle={onToggle} />
    );
    fireEvent.click(container.querySelector('[data-granit-reaction-strip-picker]') as HTMLElement);
    await waitFor(() => expect(getByTestId('mock-emoji-picker')).not.toBeNull());
    fireEvent.click(getByTestId('pick-valid'));
    expect(onToggle).toHaveBeenCalledWith({ entryId: ENTRY_ID, emoji: '🎉' });
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mock-emoji-picker"]')).toBeNull()
    );
  });

  it('ignores a picked value that is not a valid emoji', async () => {
    const onToggle = vi.fn();
    const { container, getByTestId } = render(
      <ReactionStrip entryId={ENTRY_ID} reactions={{}} onToggle={onToggle} />
    );
    fireEvent.click(container.querySelector('[data-granit-reaction-strip-picker]') as HTMLElement);
    await waitFor(() => expect(getByTestId('mock-emoji-picker')).not.toBeNull());
    fireEvent.click(getByTestId('pick-invalid'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('closes the popover via the picker onClose callback', async () => {
    const { container, getByTestId } = render(
      <ReactionStrip entryId={ENTRY_ID} reactions={{}} onToggle={vi.fn()} />
    );
    fireEvent.click(container.querySelector('[data-granit-reaction-strip-picker]') as HTMLElement);
    await waitFor(() => expect(getByTestId('mock-emoji-picker')).not.toBeNull());
    fireEvent.click(getByTestId('pick-close'));
    await waitFor(() =>
      expect(document.querySelector('[data-testid="mock-emoji-picker"]')).toBeNull()
    );
  });
});
