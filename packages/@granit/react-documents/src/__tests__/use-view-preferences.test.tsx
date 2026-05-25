import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_TILE_SIZE,
  DEFAULT_VIEW_MODE,
  TILE_SIZE_STEPS,
  useViewPreferences,
} from '../hooks/use-view-preferences.ts';

const KEY = 'test:view-prefs';

describe('useViewPreferences', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });
  afterEach(() => {
    globalThis.localStorage.clear();
  });

  it('starts with defaults when nothing is persisted', () => {
    const { result } = renderHook(() => useViewPreferences(KEY));
    expect(result.current.viewMode).toBe(DEFAULT_VIEW_MODE);
    expect(result.current.tileSize).toBe(DEFAULT_TILE_SIZE);
  });

  it('hydrates from localStorage on mount', () => {
    globalThis.localStorage.setItem(
      KEY,
      JSON.stringify({ viewMode: 'grid', tileSize: TILE_SIZE_STEPS[3] })
    );
    const { result } = renderHook(() => useViewPreferences(KEY));
    expect(result.current.viewMode).toBe('grid');
    expect(result.current.tileSize).toBe(TILE_SIZE_STEPS[3]);
  });

  it('persists updates back to localStorage', () => {
    const { result } = renderHook(() => useViewPreferences(KEY));
    act(() => result.current.setViewMode('grid'));
    act(() => result.current.setTileSize(TILE_SIZE_STEPS[4]!));

    const stored = JSON.parse(globalThis.localStorage.getItem(KEY) ?? '{}') as {
      viewMode?: string;
      tileSize?: number;
    };
    expect(stored.viewMode).toBe('grid');
    expect(stored.tileSize).toBe(TILE_SIZE_STEPS[4]);
  });

  it('ignores corrupt JSON and falls back to defaults', () => {
    globalThis.localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useViewPreferences(KEY));
    expect(result.current.viewMode).toBe(DEFAULT_VIEW_MODE);
    expect(result.current.tileSize).toBe(DEFAULT_TILE_SIZE);
  });

  it('ignores unknown viewMode / out-of-range tileSize from storage', () => {
    globalThis.localStorage.setItem(KEY, JSON.stringify({ viewMode: 'weird', tileSize: 9999 }));
    const { result } = renderHook(() => useViewPreferences(KEY));
    expect(result.current.viewMode).toBe(DEFAULT_VIEW_MODE);
    expect(result.current.tileSize).toBe(DEFAULT_TILE_SIZE);
  });

  it('does not touch localStorage when storageKey is null', () => {
    const { result } = renderHook(() => useViewPreferences(null));
    act(() => result.current.setViewMode('grid'));
    expect(globalThis.localStorage.length).toBe(0);
    // In-memory state still updates.
    expect(result.current.viewMode).toBe('grid');
  });
});
