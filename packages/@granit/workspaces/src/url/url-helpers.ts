// ---------------------------------------------------------------------------
// URL helpers — pure routing primitives shared across consumer apps.
// ---------------------------------------------------------------------------
//
// The framework deliberately stays router-agnostic; these helpers produce
// and parse the canonical Granit URL shapes:
//
//   /w/{workspace}              workspace root
//   /w/{workspace}/{...segments} workspace-scoped sub-routes
//   /entity/{id}                workspace-agnostic detail page
//
// Apps wire these into React Router (or whichever router they use)
// without taking a runtime dependency on the framework router contract.

const WORKSPACE_PREFIX = '/w/';
const ENTITY_PREFIX = '/entity/';

/**
 * Build a workspace-scoped URL.
 *
 * - `buildWorkspaceUrl('Granit.Showcase.CRM')` → `/w/Granit.Showcase.CRM`
 * - `buildWorkspaceUrl('CRM', 'parties')` → `/w/CRM/parties`
 * - `buildWorkspaceUrl('CRM', 'parties', '42')` → `/w/CRM/parties/42`
 *
 * Each segment is `encodeURIComponent`-ed so workspace names containing
 * dots / spaces / non-ASCII characters round-trip cleanly.
 */
export function buildWorkspaceUrl(workspaceName: string, ...segments: readonly string[]): string {
  const encoded = [encodeURIComponent(workspaceName), ...segments.map(encodeURIComponent)];
  return `${WORKSPACE_PREFIX}${encoded.join('/')}`;
}

/**
 * Build a workspace-agnostic entity-detail URL.
 *
 * `buildEntityUrl('8c6b1e10-...')` → `/entity/8c6b1e10-...`
 */
export function buildEntityUrl(entityId: string): string {
  return `${ENTITY_PREFIX}${encodeURIComponent(entityId)}`;
}

/**
 * Result of parsing a workspace-scoped pathname.
 *
 * `workspace` is the decoded workspace name; `segments` carries the
 * decoded sub-segments after it (typically `[entityName?, viewName?, ...]`,
 * but the framework deliberately leaves segment semantics to the app).
 */
export interface ParsedWorkspaceUrl {
  readonly workspace: string;
  readonly segments: readonly string[];
}

/**
 * Parse `/w/{workspace}/{...segments}`. Returns `null` for any pathname
 * that doesn't start with `/w/` or that has an empty workspace slot —
 * letting the caller fall through to the default routing tree rather
 * than redirecting to a malformed workspace.
 */
export function parseWorkspaceUrl(pathname: string): ParsedWorkspaceUrl | null {
  if (!pathname.startsWith(WORKSPACE_PREFIX)) return null;
  const tail = pathname.slice(WORKSPACE_PREFIX.length);
  if (tail.length === 0) return null;
  const parts = tail.split('/').map(safeDecode);
  const [workspace, ...segments] = parts;
  if (!workspace) return null;
  return { workspace, segments };
}

/** Result of parsing an entity-detail pathname. */
export interface ParsedEntityUrl {
  readonly id: string;
}

/**
 * Parse `/entity/{id}`. Returns `null` when the pathname doesn't match
 * (e.g. the user landed on `/w/CRM/...` or a custom app route) so the
 * caller can keep its existing routing fall-through.
 */
export function parseEntityUrl(pathname: string): ParsedEntityUrl | null {
  if (!pathname.startsWith(ENTITY_PREFIX)) return null;
  const tail = pathname.slice(ENTITY_PREFIX.length);
  if (tail.length === 0 || tail.includes('/')) return null;
  const id = safeDecode(tail);
  if (!id) return null;
  return { id };
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
