import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSidePeek, type SidePeekEntry, type UseSidePeekOptions } from '../hooks/use-side-peek';

function harness(initial: Partial<UseSidePeekOptions> = {}) {
  let search = initial.search ?? '';
  const onSearchChange = vi.fn((next: string) => {
    search = next;
  });
  const onExpand = initial.onExpand ?? vi.fn();
  const { result, rerender } = renderHook((props: UseSidePeekOptions) => useSidePeek(props), {
    initialProps: {
      search,
      onSearchChange,
      onExpand,
      enableShortcuts: initial.enableShortcuts,
    },
  });
  const flush = () =>
    rerender({ search, onSearchChange, onExpand, enableShortcuts: initial.enableShortcuts });
  return { result, rerender: flush, onSearchChange, onExpand, getSearch: () => search };
}

const PARTY: SidePeekEntry = { entityName: 'Granit.Parties.Party', entityId: '42' };
const INVOICE: SidePeekEntry = { entityName: 'Granit.Invoicing.Invoice', entityId: '100' };

describe('useSidePeek — parse', () => {
  it('returns an empty stack when no peek param is present', () => {
    const { result } = harness({ search: '?other=1' });
    expect(result.current.peek).toBeNull();
    expect(result.current.stack).toEqual([]);
  });

  it('parses a single peek entry', () => {
    const { result } = harness({
      search: `?peek=${encodeURIComponent('Granit.Parties.Party')}:42`,
    });
    expect(result.current.peek).toEqual(PARTY);
    expect(result.current.stack).toEqual([PARTY]);
  });

  it('parses a stacked peek and exposes the top as `peek`', () => {
    const { result } = harness({
      search:
        `?peek=${encodeURIComponent('Granit.Parties.Party')}:42,` +
        `${encodeURIComponent('Granit.Invoicing.Invoice')}:100`,
    });
    expect(result.current.stack).toEqual([PARTY, INVOICE]);
    expect(result.current.peek).toEqual(INVOICE);
  });

  it('falls back to an empty stack on malformed entries', () => {
    const { result } = harness({ search: '?peek=:nothing,broken,Party:' });
    expect(result.current.stack).toEqual([]);
  });
});

describe('useSidePeek — mutate', () => {
  it('openPeek pushes an entry and writes it back through onSearchChange', () => {
    const { result, onSearchChange } = harness();
    act(() => result.current.openPeek(PARTY));
    expect(onSearchChange).toHaveBeenCalledWith(
      `?peek=${encodeURIComponent('Granit.Parties.Party')}%3A42`
    );
  });

  it('closePeek pops the top of the stack', () => {
    const { result, onSearchChange } = harness({
      search: `?peek=${encodeURIComponent('Granit.Parties.Party')}:42`,
    });
    act(() => result.current.closePeek());
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('closeAll empties the stack', () => {
    const { result, onSearchChange } = harness({
      search:
        `?peek=${encodeURIComponent('Granit.Parties.Party')}:42,` +
        `${encodeURIComponent('Granit.Invoicing.Invoice')}:100&other=1`,
    });
    act(() => result.current.closeAll());
    expect(onSearchChange).toHaveBeenCalledWith('?other=1');
  });

  it('preserves unrelated query params when updating peek', () => {
    const { result, onSearchChange } = harness({ search: '?other=1' });
    act(() => result.current.openPeek(PARTY));
    expect(onSearchChange.mock.calls[0]?.[0]).toContain('other=1');
    expect(onSearchChange.mock.calls[0]?.[0]).toContain('peek=');
  });

  it('expandPeek calls onExpand with the canonical /entity/{id} url', () => {
    const onExpand = vi.fn();
    const { result } = harness({
      search: `?peek=${encodeURIComponent('Granit.Parties.Party')}:42`,
      onExpand,
    });
    act(() => result.current.expandPeek());
    expect(onExpand).toHaveBeenCalledWith('/entity/42');
  });

  it('expandPeek is a no-op when no peek is active', () => {
    const onExpand = vi.fn();
    const { result } = harness({ onExpand });
    act(() => result.current.expandPeek());
    expect(onExpand).not.toHaveBeenCalled();
  });
});

describe('useSidePeek — keyboard shortcuts', () => {
  it('Escape closes the top peek when one is active', () => {
    const { result, onSearchChange } = harness({
      search: `?peek=${encodeURIComponent('Granit.Parties.Party')}:42`,
    });
    expect(result.current.peek).toEqual(PARTY);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('Cmd+Shift+. fires expand on the top peek', () => {
    const onExpand = vi.fn();
    harness({
      search: `?peek=${encodeURIComponent('Granit.Parties.Party')}:42`,
      onExpand,
    });
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '.', metaKey: true, shiftKey: true })
      );
    });
    expect(onExpand).toHaveBeenCalledWith('/entity/42');
  });

  it('does nothing without a peek', () => {
    const onExpand = vi.fn();
    const { onSearchChange } = harness({ onExpand });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '.', ctrlKey: true, shiftKey: true })
      );
    });
    expect(onExpand).not.toHaveBeenCalled();
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it('honours enableShortcuts: false', () => {
    const onExpand = vi.fn();
    const { onSearchChange } = harness({
      search: `?peek=${encodeURIComponent('Granit.Parties.Party')}:42`,
      onExpand,
      enableShortcuts: false,
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: '.', metaKey: true, shiftKey: true })
      );
    });
    expect(onSearchChange).not.toHaveBeenCalled();
    expect(onExpand).not.toHaveBeenCalled();
  });
});
