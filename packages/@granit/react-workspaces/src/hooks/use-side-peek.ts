import { buildEntityUrl } from '@granit/workspaces';
import { useCallback, useEffect, useMemo } from 'react';

const PEEK_PARAM = 'peek';
const ENTRY_SEPARATOR = ',';
const FIELD_SEPARATOR = ':';

/** One peek entry — the entity name + id surfaced in the side drawer. */
export interface SidePeekEntry {
  readonly entityName: string;
  readonly entityId: string;
}

export interface UseSidePeekOptions {
  /**
   * Current URL search string (incl. leading `?` or not), typically
   * `useLocation().search` from React Router or
   * `window.location.search`.
   */
  readonly search: string;
  /**
   * Callback invoked when the peek stack changes — receives the next
   * search string. Hosts wrap their router's navigate / push so the URL
   * updates and the rest of the app re-renders.
   */
  readonly onSearchChange: (nextSearch: string) => void;
  /**
   * Optional handler invoked when the user expands the top peek to a
   * full page via `⌘+⇧+.`. Receives the workspace-agnostic detail URL
   * (`/entity/{id}`); the host typically calls `navigate(url)`.
   *
   * When omitted, the shortcut is a no-op.
   */
  readonly onExpand?: (fullPath: string) => void;
  /**
   * Keyboard shortcuts opt-out. Defaults to `true`. Tests + hosts that
   * own their own shortcut handling can disable the global listeners.
   */
  readonly enableShortcuts?: boolean;
}

export interface UseSidePeekReturn {
  /** Top-of-stack peek, or `null` when no peek is active. */
  readonly peek: SidePeekEntry | null;
  /** Full peek stack — earliest first, top is last. */
  readonly stack: readonly SidePeekEntry[];
  /** Push a new peek onto the stack. */
  readonly openPeek: (entry: SidePeekEntry) => void;
  /** Pop the top peek (closes the drawer when stack becomes empty). */
  readonly closePeek: () => void;
  /** Empty the stack — closes every nested peek at once. */
  readonly closeAll: () => void;
  /** Expand the top peek to the canonical `/entity/{id}` page. */
  readonly expandPeek: () => void;
}

/**
 * Stateless URL-bound side-peek state. Reads `?peek=...` from the
 * supplied search string, exposes the parsed stack + operations, and
 * round-trips updates back through `onSearchChange`.
 *
 * Wire format: `?peek=entityName:id[,entityName:id]*`. Each
 * `entityName` and `id` is URL-encoded individually so dots in entity
 * names (`Granit.Parties.Party`) and slashes in ids round-trip cleanly.
 *
 * Keyboard shortcuts (when `enableShortcuts !== false` and a peek is
 * active):
 *
 * - `Esc` — close the top peek
 * - `⌘+⇧+.` (or `Ctrl+Shift+.` on non-mac) — expand to full page
 *
 * Stays router-agnostic: the host owns navigation. `onSearchChange`
 * typically wraps `navigate({ search: next })`; `onExpand` typically
 * wraps `navigate(fullPath)`.
 */
export function useSidePeek({
  search,
  onSearchChange,
  onExpand,
  enableShortcuts = true,
}: UseSidePeekOptions): UseSidePeekReturn {
  const stack = useMemo(() => parsePeekStack(search), [search]);
  const peek = stack.length > 0 ? (stack[stack.length - 1] ?? null) : null;

  const updateStack = useCallback(
    (next: readonly SidePeekEntry[]) => {
      onSearchChange(rewritePeekParam(search, next));
    },
    [search, onSearchChange]
  );

  const openPeek = useCallback(
    (entry: SidePeekEntry) => updateStack([...stack, entry]),
    [stack, updateStack]
  );
  const closePeek = useCallback(() => updateStack(stack.slice(0, -1)), [stack, updateStack]);
  const closeAll = useCallback(() => updateStack([]), [updateStack]);
  const expandPeek = useCallback(() => {
    if (!peek || !onExpand) return;
    onExpand(buildEntityUrl(peek.entityId));
  }, [peek, onExpand]);

  useEffect(() => {
    if (!enableShortcuts || !peek) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePeek();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
        e.preventDefault();
        expandPeek();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enableShortcuts, peek, closePeek, expandPeek]);

  return { peek, stack, openPeek, closePeek, closeAll, expandPeek };
}

/**
 * Parse the `?peek=` query parameter into a list of entries. Returns
 * an empty array for missing / malformed values rather than throwing,
 * so a hand-typed URL never crashes the renderer.
 */
function parsePeekStack(search: string): readonly SidePeekEntry[] {
  const params = readSearchParams(search);
  const raw = params.get(PEEK_PARAM);
  if (!raw) return [];
  const entries: SidePeekEntry[] = [];
  for (const segment of raw.split(ENTRY_SEPARATOR)) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const sepIdx = trimmed.indexOf(FIELD_SEPARATOR);
    if (sepIdx <= 0 || sepIdx >= trimmed.length - 1) continue;
    const entityName = safeDecode(trimmed.slice(0, sepIdx));
    const entityId = safeDecode(trimmed.slice(sepIdx + 1));
    if (!entityName || !entityId) continue;
    entries.push({ entityName, entityId });
  }
  return entries;
}

/**
 * Replace the `peek` parameter in the search string with the serialised
 * stack, preserving every other query parameter so we don't clobber
 * filters / view selectors that share the URL.
 */
function rewritePeekParam(search: string, stack: readonly SidePeekEntry[]): string {
  const params = readSearchParams(search);
  if (stack.length === 0) {
    params.delete(PEEK_PARAM);
  } else {
    params.set(PEEK_PARAM, serialiseStack(stack));
  }
  const out = params.toString();
  return out === '' ? '' : `?${out}`;
}

function serialiseStack(stack: readonly SidePeekEntry[]): string {
  return stack
    .map(
      (entry) =>
        `${encodeURIComponent(entry.entityName)}${FIELD_SEPARATOR}${encodeURIComponent(entry.entityId)}`
    )
    .join(ENTRY_SEPARATOR);
}

function readSearchParams(search: string): URLSearchParams {
  const trimmed = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(trimmed);
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
