import { useCallback, useEffect, useState } from 'react';

export type DocumentsViewMode = 'list' | 'grid';

/** Discrete tile-size steps (px). Indexed 0..N-1 for the slider. */
export const TILE_SIZE_STEPS = [96, 128, 160, 200, 240] as const;
export type TileSizeStep = (typeof TILE_SIZE_STEPS)[number];

export const DEFAULT_VIEW_MODE: DocumentsViewMode = 'list';
export const DEFAULT_TILE_SIZE: TileSizeStep = 160;

export interface ViewPreferences {
  readonly viewMode: DocumentsViewMode;
  readonly tileSize: TileSizeStep;
  readonly setViewMode: (mode: DocumentsViewMode) => void;
  readonly setTileSize: (size: TileSizeStep) => void;
}

interface StorageShape {
  readonly viewMode?: DocumentsViewMode;
  readonly tileSize?: TileSizeStep;
}

function readStorage(key: string): StorageShape | null {
  if (typeof globalThis.localStorage === 'undefined') return null;
  try {
    const raw = globalThis.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorageShape;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: StorageShape): void {
  if (typeof globalThis.localStorage === 'undefined') return;
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled — silently ignore */
  }
}

/**
 * Persists list/grid view mode and tile size in `localStorage` so the
 * choice survives reloads. The `storageKey` is supplied by the caller so
 * different mount points (tenant-scoped, per-folder, …) can keep
 * independent preferences. Passing `null` disables persistence — useful
 * for tests and for callers that hold the state elsewhere.
 *
 * Hydration is deferred to a mount-time effect so the SSR / first paint
 * is deterministic (always the default), then the real value swaps in on
 * the client. Avoids the classic hydration-mismatch hazard.
 */
export function useViewPreferences(storageKey: string | null): ViewPreferences {
  const [viewMode, setViewModeState] = useState<DocumentsViewMode>(DEFAULT_VIEW_MODE);
  const [tileSize, setTileSizeState] = useState<TileSizeStep>(DEFAULT_TILE_SIZE);

  useEffect(() => {
    if (!storageKey) return;
    const stored = readStorage(storageKey);
    if (!stored) return;
    if (stored.viewMode === 'list' || stored.viewMode === 'grid') {
      setViewModeState(stored.viewMode);
    }
    if (
      typeof stored.tileSize === 'number' &&
      (TILE_SIZE_STEPS as readonly number[]).includes(stored.tileSize)
    ) {
      setTileSizeState(stored.tileSize);
    }
  }, [storageKey]);

  const setViewMode = useCallback(
    (mode: DocumentsViewMode) => {
      setViewModeState(mode);
      if (storageKey) writeStorage(storageKey, { viewMode: mode, tileSize });
    },
    [storageKey, tileSize]
  );

  const setTileSize = useCallback(
    (size: TileSizeStep) => {
      setTileSizeState(size);
      if (storageKey) writeStorage(storageKey, { viewMode, tileSize: size });
    },
    [storageKey, viewMode]
  );

  return { viewMode, tileSize, setViewMode, setTileSize };
}
