import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useDocumentBookmarks } from '../hooks/use-document-bookmarks.ts';

const KEY = 'test:bookmarks';

describe('useDocumentBookmarks', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });
  afterEach(() => {
    globalThis.localStorage.clear();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useDocumentBookmarks(KEY));
    expect(result.current.favorites).toEqual([]);
    expect(result.current.recents).toEqual([]);
  });

  it('toggleFavorite adds and removes', () => {
    const { result } = renderHook(() => useDocumentBookmarks(KEY));
    act(() => result.current.toggleFavorite({ id: 'doc-1', name: 'a.pdf', folderId: 'fld-1' }));
    expect(result.current.isFavorite('doc-1')).toBe(true);
    expect(result.current.favorites.length).toBe(1);

    act(() => result.current.toggleFavorite({ id: 'doc-1', name: 'a.pdf', folderId: 'fld-1' }));
    expect(result.current.isFavorite('doc-1')).toBe(false);
    expect(result.current.favorites.length).toBe(0);
  });

  it('recordOpen pushes to the front and dedupes', () => {
    const { result } = renderHook(() => useDocumentBookmarks(KEY));
    act(() => result.current.recordOpen({ id: 'doc-1', name: 'a.pdf', folderId: null }));
    act(() => result.current.recordOpen({ id: 'doc-2', name: 'b.pdf', folderId: null }));
    act(() => result.current.recordOpen({ id: 'doc-1', name: 'a.pdf', folderId: null }));

    expect(result.current.recents.map((r) => r.id)).toEqual(['doc-1', 'doc-2']);
  });

  it('caps recents to the configured size', () => {
    const { result } = renderHook(() => useDocumentBookmarks(KEY, { recentsCap: 3 }));
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      act(() => result.current.recordOpen({ id, name: `${id}.pdf`, folderId: null }));
    }
    expect(result.current.recents.map((r) => r.id)).toEqual(['e', 'd', 'c']);
  });

  it('persists across mounts via localStorage', () => {
    const first = renderHook(() => useDocumentBookmarks(KEY));
    act(() => first.result.current.toggleFavorite({ id: 'doc-1', name: 'a.pdf', folderId: null }));
    act(() => first.result.current.recordOpen({ id: 'doc-2', name: 'b.pdf', folderId: null }));

    const second = renderHook(() => useDocumentBookmarks(KEY));
    expect(second.result.current.favorites.map((f) => f.id)).toEqual(['doc-1']);
    expect(second.result.current.recents.map((r) => r.id)).toEqual(['doc-2']);
  });

  it('forget removes from both lists', () => {
    const { result } = renderHook(() => useDocumentBookmarks(KEY));
    act(() => {
      result.current.toggleFavorite({ id: 'doc-1', name: 'a.pdf', folderId: null });
      result.current.recordOpen({ id: 'doc-1', name: 'a.pdf', folderId: null });
    });
    expect(result.current.favorites.length).toBe(1);
    expect(result.current.recents.length).toBe(1);

    act(() => result.current.forget('doc-1'));
    expect(result.current.favorites.length).toBe(0);
    expect(result.current.recents.length).toBe(0);
  });

  it('null storageKey keeps state in memory only', () => {
    const { result } = renderHook(() => useDocumentBookmarks(null));
    act(() => result.current.toggleFavorite({ id: 'doc-1', name: 'a.pdf', folderId: null }));
    expect(result.current.favorites.length).toBe(1);
    expect(globalThis.localStorage.length).toBe(0);
  });

  it('ignores corrupt storage payload', () => {
    globalThis.localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useDocumentBookmarks(KEY));
    expect(result.current.favorites).toEqual([]);
  });

  it('drops malformed bookmark entries from storage', () => {
    globalThis.localStorage.setItem(
      KEY,
      JSON.stringify({
        favorites: [
          { id: 'doc-1', name: 'a.pdf', folderId: null, recordedAt: 1 },
          { id: 'doc-2' }, // missing fields
          'nope',
        ],
        recents: 'not-an-array',
      })
    );
    const { result } = renderHook(() => useDocumentBookmarks(KEY));
    expect(result.current.favorites.map((f) => f.id)).toEqual(['doc-1']);
    expect(result.current.recents).toEqual([]);
  });
});
