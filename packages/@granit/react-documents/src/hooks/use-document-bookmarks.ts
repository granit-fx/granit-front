import { useCallback, useEffect, useState } from 'react';

export interface DocumentBookmark {
  readonly id: string;
  readonly name: string;
  readonly folderId: string | null;
  /** Unix ms — used to sort recents and decay favorites in future versions. */
  readonly recordedAt: number;
}

export interface DocumentBookmarksApi {
  readonly favorites: readonly DocumentBookmark[];
  readonly recents: readonly DocumentBookmark[];
  readonly isFavorite: (id: string) => boolean;
  readonly toggleFavorite: (entry: Omit<DocumentBookmark, 'recordedAt'>) => void;
  readonly recordOpen: (entry: Omit<DocumentBookmark, 'recordedAt'>) => void;
  readonly removeFavorite: (id: string) => void;
  readonly forget: (id: string) => void;
}

interface StoredBookmarks {
  readonly favorites?: readonly DocumentBookmark[];
  readonly recents?: readonly DocumentBookmark[];
}

const DEFAULT_RECENTS_CAP = 20;

function isBookmark(value: unknown): value is DocumentBookmark {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (obj.folderId === null || typeof obj.folderId === 'string') &&
    typeof obj.recordedAt === 'number'
  );
}

import { readJsonFromStorage, writeJsonToStorage } from './storage-utils';

const readStorage = (key: string) => readJsonFromStorage<StoredBookmarks>(key);
const writeStorage = (key: string, value: StoredBookmarks) => writeJsonToStorage(key, value);

export interface UseDocumentBookmarksOptions {
  /** Max recents to keep. Defaults to 20. Older entries fall off the end. */
  readonly recentsCap?: number;
}

/**
 * Manages two ordered bookmark lists in `localStorage`:
 *
 * - **Favorites** — explicit user pins. Toggled via `toggleFavorite`. Survive
 *   reloads; safe to render as a sidebar without re-fetching the underlying
 *   documents (denormalized name + folder id).
 * - **Recents** — auto-recorded when the explorer opens a document. Ring
 *   buffer capped at `recentsCap` (20 by default). The most recent entry is
 *   pulled to the front on every reopen.
 *
 * Pass `null` as `storageKey` to disable persistence (in-memory only) —
 * useful for tests and stateless mounts. Both lists prune themselves of
 * stale entries via `forget(id)` when a document goes away (trashed or
 * permanently deleted) and the consumer wires the callback.
 */
export function useDocumentBookmarks(
  storageKey: string | null,
  options: UseDocumentBookmarksOptions = {}
): DocumentBookmarksApi {
  const cap = options.recentsCap ?? DEFAULT_RECENTS_CAP;
  const [favorites, setFavorites] = useState<readonly DocumentBookmark[]>([]);
  const [recents, setRecents] = useState<readonly DocumentBookmark[]>([]);

  useEffect(() => {
    if (!storageKey) return;
    const stored = readStorage(storageKey);
    if (!stored) return;
    if (Array.isArray(stored.favorites)) {
      setFavorites(stored.favorites.filter(isBookmark));
    }
    if (Array.isArray(stored.recents)) {
      setRecents(stored.recents.filter(isBookmark).slice(0, cap));
    }
  }, [storageKey, cap]);

  // Persist on every state change. The dep array keeps both lists in sync
  // even when only one of them updates.
  useEffect(() => {
    if (!storageKey) return;
    writeStorage(storageKey, { favorites, recents });
  }, [storageKey, favorites, recents]);

  const isFavorite = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites]);

  const toggleFavorite = useCallback((entry: Omit<DocumentBookmark, 'recordedAt'>) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === entry.id);
      if (exists) return prev.filter((f) => f.id !== entry.id);
      const bookmark: DocumentBookmark = { ...entry, recordedAt: Date.now() };
      return [bookmark, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const recordOpen = useCallback(
    (entry: Omit<DocumentBookmark, 'recordedAt'>) => {
      setRecents((prev) => {
        const bookmark: DocumentBookmark = { ...entry, recordedAt: Date.now() };
        const filtered = prev.filter((r) => r.id !== entry.id);
        return [bookmark, ...filtered].slice(0, cap);
      });
    },
    [cap]
  );

  const forget = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    setRecents((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    favorites,
    recents,
    isFavorite,
    toggleFavorite,
    recordOpen,
    removeFavorite,
    forget,
  };
}
