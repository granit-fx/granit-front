import { parseWorkspaceUrl } from '@granit/workspaces';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'granit:host:active-workspace';
const CHANGE_EVENT = 'granit:active-workspace-changed';

function readStored(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeStored(value: string | null): void {
  try {
    if (value) globalThis.localStorage?.setItem(STORAGE_KEY, value);
    else globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage unavailable (private mode, SSR) — silently ignore. */
  }
  globalThis.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  globalThis.addEventListener(CHANGE_EVENT, onChange);
  globalThis.addEventListener('storage', onChange);
  return () => {
    globalThis.removeEventListener(CHANGE_EVENT, onChange);
    globalThis.removeEventListener('storage', onChange);
  };
}

export interface UseActiveWorkspaceReturn {
  /**
   * The currently active workspace name. Resolved from the URL when the
   * user is on `/w/{name}/...`, otherwise from the persisted last-selected
   * workspace. `null` when no workspace has ever been picked.
   */
  readonly activeWorkspaceName: string | null;
  /**
   * Manually set the active workspace — typically called from the launcher
   * tile click or from a workspace item click in a modal. Persists across
   * page reloads via localStorage.
   */
  readonly setActiveWorkspace: (name: string | null) => void;
}

// Tracks the active workspace independently of the current route. The URL
// always wins when it carries `/w/{name}/...` (deep links + refresh
// round-trip cleanly), with localStorage as the fallback for routes that
// don't carry the workspace prefix yet (legacy `/parties`, `/invoicing`,
// etc., reachable from a workspace's modal). The launcher / switcher write
// to it explicitly so a click on a tile is enough to "select" the
// workspace even before any navigation happens.
//
// Storage is wired via `useSyncExternalStore` so cross-component updates
// (launcher writes, switcher reads) re-render in sync without needing a
// React context provider higher in the tree.
export function useActiveWorkspace(): UseActiveWorkspaceReturn {
  const location = useLocation();
  const parsed = parseWorkspaceUrl(location.pathname);
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const isHome = location.pathname === '/';

  // Mirror the URL workspace into storage so a subsequent navigation away
  // (e.g. clicking a Link item that escapes the `/w/` prefix) keeps the
  // switcher pinned to the workspace the user came from.
  useEffect(() => {
    if (parsed?.workspace && parsed.workspace !== stored) {
      writeStored(parsed.workspace);
    }
  }, [parsed?.workspace, stored]);

  const setActiveWorkspace = useCallback((name: string | null) => {
    writeStored(name);
  }, []);

  // The launcher (`/`) is a deliberate "no workspace selected" state — even
  // if storage holds a previously-visited workspace, the switcher / sidebar
  // should both reset there. Storage stays intact so legacy-route
  // navigations (`/parties`, `/settings/config`, …) still fall back to the
  // last-visited workspace as expected.
  return {
    activeWorkspaceName: isHome ? null : (parsed?.workspace ?? stored),
    setActiveWorkspace,
  };
}
