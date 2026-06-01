import { useState } from 'react';

import { classifyDocumentName, documentBadge } from './document-kind';
import { FolderTree } from './folder-tree';

import type { FolderTreeLabels, FolderTreeProps } from './folder-tree';
import type { DocumentBookmark } from '../hooks/use-document-bookmarks';
import type { FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

export type DocumentsSidebarTab = 'folders' | 'favorites' | 'recents';

export interface DocumentsSidebarLabels {
  readonly foldersTab?: string;
  readonly favoritesTab?: string;
  readonly recentsTab?: string;
  readonly favoritesEmpty?: string;
  readonly recentsEmpty?: string;
  readonly removeFavorite?: string;
  readonly tree?: FolderTreeLabels;
}

export interface DocumentsSidebarProps {
  /** Folder tree props forwarded verbatim — the sidebar owns the tab shell. */
  readonly folderTree: Omit<FolderTreeProps, 'labels' | 'onSelect'> & {
    readonly onSelect?: (folder: FolderResponse) => void;
  };
  readonly favorites: readonly DocumentBookmark[];
  readonly recents: readonly DocumentBookmark[];
  /** Opens a document — wired to the explorer's `onOpenDocument`. */
  readonly onPickBookmark: (bookmark: DocumentBookmark) => void;
  /** Optional unpin action; when omitted, favorites are read-only. */
  readonly onRemoveFavorite?: (id: string) => void;
  readonly labels?: DocumentsSidebarLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<Omit<DocumentsSidebarLabels, 'tree'>> = {
  foldersTab: 'Folders',
  favoritesTab: 'Favorites',
  recentsTab: 'Recent',
  favoritesEmpty: 'No favorites yet. Star a document in the inspector to pin it here.',
  recentsEmpty: 'No recent documents. Open one to see it here.',
  removeFavorite: 'Remove favorite',
};

/**
 * Tabbed left-pane shell for the documents explorer. Three sections:
 *
 * - **Folders** — wraps the existing `<FolderTree>`.
 * - **Favorites** — pinned bookmarks (from `useDocumentBookmarks`).
 * - **Recents** — auto-recorded list of last-opened documents.
 *
 * Tab state is local — switches do not refetch folders (the tree's lazy
 * loading is preserved). Bookmark sections are flat lists; clicking an
 * item fires `onPickBookmark` (the explorer routes this through its
 * own `onOpenDocument`, which also feeds the recents recorder, so an
 * opened recent stays at the top).
 */
export function DocumentsSidebar({
  folderTree,
  favorites,
  recents,
  onPickBookmark,
  onRemoveFavorite,
  labels,
  className,
}: DocumentsSidebarProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [activeTab, setActiveTab] = useState<DocumentsSidebarTab>('folders');

  return (
    <div data-granit-documents-sidebar="" className={className}>
      <nav
        data-granit-documents-sidebar-tabs=""
        role="tablist"
        aria-label={labelStrings.foldersTab}
      >
        <button
          type="button"
          role="tab"
          data-granit-documents-sidebar-tab="folders"
          aria-selected={activeTab === 'folders'}
          aria-pressed={activeTab === 'folders'}
          onClick={() => setActiveTab('folders')}
        >
          {labelStrings.foldersTab}
        </button>
        <button
          type="button"
          role="tab"
          data-granit-documents-sidebar-tab="favorites"
          aria-selected={activeTab === 'favorites'}
          aria-pressed={activeTab === 'favorites'}
          onClick={() => setActiveTab('favorites')}
        >
          {labelStrings.favoritesTab}
          {favorites.length > 0 && (
            <span data-granit-documents-sidebar-count="">{favorites.length}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          data-granit-documents-sidebar-tab="recents"
          aria-selected={activeTab === 'recents'}
          aria-pressed={activeTab === 'recents'}
          onClick={() => setActiveTab('recents')}
        >
          {labelStrings.recentsTab}
          {recents.length > 0 && (
            <span data-granit-documents-sidebar-count="">{recents.length}</span>
          )}
        </button>
      </nav>
      <div
        data-granit-documents-sidebar-panel=""
        data-granit-documents-sidebar-active-tab={activeTab}
        role="tabpanel"
      >
        {activeTab === 'folders' && <FolderTree {...folderTree} labels={labels?.tree} />}
        {activeTab === 'favorites' && (
          <BookmarkList
            bookmarks={favorites}
            emptyLabel={labelStrings.favoritesEmpty}
            onPick={onPickBookmark}
            onRemove={onRemoveFavorite}
            removeLabel={labelStrings.removeFavorite}
          />
        )}
        {activeTab === 'recents' && (
          <BookmarkList
            bookmarks={recents}
            emptyLabel={labelStrings.recentsEmpty}
            onPick={onPickBookmark}
          />
        )}
      </div>
    </div>
  );
}

interface BookmarkListProps {
  readonly bookmarks: readonly DocumentBookmark[];
  readonly emptyLabel: string;
  readonly onPick: (bookmark: DocumentBookmark) => void;
  readonly onRemove?: (id: string) => void;
  readonly removeLabel?: string;
}

function BookmarkList({
  bookmarks,
  emptyLabel,
  onPick,
  onRemove,
  removeLabel,
}: BookmarkListProps): ReactNode {
  if (bookmarks.length === 0) {
    return <p data-granit-documents-sidebar-empty="">{emptyLabel}</p>;
  }
  return (
    <ul data-granit-documents-sidebar-list="">
      {bookmarks.map((bookmark) => {
        const kind = classifyDocumentName(bookmark.name);
        return (
          <li
            key={bookmark.id}
            data-granit-documents-sidebar-item=""
            data-granit-document-id={bookmark.id}
            data-granit-document-kind={kind}
          >
            <button
              type="button"
              data-granit-documents-sidebar-item-pick=""
              onClick={() => onPick(bookmark)}
            >
              <span data-granit-documents-sidebar-item-badge="">
                {documentBadge(bookmark.name)}
              </span>
              <span data-granit-documents-sidebar-item-name="">{bookmark.name}</span>
            </button>
            {onRemove && removeLabel && (
              <button
                type="button"
                data-granit-documents-sidebar-item-remove=""
                aria-label={removeLabel}
                onClick={() => onRemove(bookmark.id)}
              >
                ×
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
