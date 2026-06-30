import type { ISODateString } from '@granit/types';

/**
 * 7-character hexadecimal color in `#RRGGBB` form. The backend rejects any
 * other shape, so the front carries the same constraint at the type level.
 * Use {@link isHexColor} to validate untrusted strings before casting.
 */
export type HexColor = `#${string}`;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): value is HexColor {
  return HEX_COLOR_PATTERN.test(value);
}

/**
 * Polymorphic target reference. `targetType` is the assembly-qualified type
 * name shipped by the backend (e.g. `"Granit.Documents.Domain.Document"`);
 * `targetId` is a Guid string.
 */
export interface TaxonomyTargetRef {
  readonly targetType: string;
  readonly targetId: string;
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export interface TagResponse {
  readonly id: string;
  /** `null` for host-level (cross-tenant) tags. */
  readonly tenantId: string | null;
  readonly scope: string;
  readonly name: string;
  readonly color: HexColor;
  readonly hideOnEntityCard: boolean;
  readonly createdAt: ISODateString;
  /**
   * Last-modification timestamp; `null` until the tag is first modified
   * (framework audit convention). For a non-null "updated at", coalesce
   * `modifiedAt ?? createdAt` at the call site.
   */
  readonly modifiedAt: ISODateString | null;
  /** Optimistic-concurrency token; echo back on edit to detect conflicts (409). */
  readonly concurrencyStamp: string;
}

export interface TagListFilter {
  readonly scope: string;
  readonly q?: string;
}

export interface CreateTagRequest {
  readonly scope: string;
  readonly name: string;
  readonly color: HexColor;
  /**
   * Absent from the contract's `required` array — omit to let the backend
   * apply its default (false), or pass `null` for the same effect.
   */
  readonly hideOnEntityCard?: boolean | null;
}

/**
 * PATCH payload for {@link TagResponse}. All fields are required-but-nullable
 * (OpenAPI `required` + `["null","T"]`): pass `null` to leave a field unchanged
 * server-side, pass a value to update it.
 */
export interface UpdateTagRequest {
  /** Optimistic-concurrency token echoed from the tag's last read. */
  readonly concurrencyStamp: string;
  readonly name: string | null;
  readonly color: string | null;
  readonly hideOnEntityCard: boolean | null;
}

export type TagAssignmentRequest = TaxonomyTargetRef;

export interface TagAssignmentResponse {
  readonly id: string;
  /** `null` for host-level assignments. */
  readonly tenantId: string | null;
  readonly tagId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly assignedAt: ISODateString;
  readonly assignedByUserId: string;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export interface CategoryResponse {
  readonly id: string;
  /** `null` for host-level (cross-tenant) categories. */
  readonly tenantId: string | null;
  readonly scope: string;
  /** `null` when the node is a scope root. */
  readonly parentId: string | null;
  readonly name: string;
  /** Materialised path, root-anchored, e.g. `"/legal/contracts/2026"`. */
  readonly path: string;
  /** 0 for scope roots; one greater than the parent's depth otherwise. */
  readonly depth: number;
  /** `null` when no icon is assigned. */
  readonly iconName: string | null;
  readonly hideOnEntityCard: boolean;
  /** `true` when at least one child exists — drives tree lazy-load. */
  readonly hasChildren: boolean;
  readonly createdAt: ISODateString;
  /** Last-modification timestamp; `null` until first modified (coalesce `?? createdAt`). */
  readonly modifiedAt: ISODateString | null;
  /** Optimistic-concurrency token; echo back on edit to detect conflicts (409). */
  readonly concurrencyStamp: string;
}

/**
 * Single-category detail, augmented with the full breadcrumb (root → leaf,
 * inclusive of the queried node) for UI rendering without extra round-trips.
 *
 * Wire format from the backend: `{ category: CategoryResponse, breadcrumb: CategoryResponse[] }`.
 * The `getCategory` API function adapts this into the flat shape so components
 * can access all fields directly without an extra `.category` dereference.
 */
export interface CategoryDetailResponse extends CategoryResponse {
  readonly breadcrumb: readonly CategoryResponse[];
}

export interface CategoryListFilter {
  readonly scope: string;
  /** Omit / pass `null` to list scope roots. */
  readonly parentId?: string | null;
}

export interface CreateCategoryRequest {
  readonly scope: string;
  readonly name: string;
  /** Absent from `required`: omit (or pass `null`) to create a scope root. */
  readonly parentId?: string | null;
  /** Absent from `required`: omit (or pass `null`) to create without an icon. */
  readonly iconName?: string | null;
  /** Absent from `required`: omit (or pass `null`) to take the backend default (false). */
  readonly hideOnEntityCard?: boolean | null;
}

/**
 * PATCH payload for {@link CategoryResponse}. All fields are required-but-nullable
 * (OpenAPI `required` + `["null","T"]`): pass `null` to leave a field unchanged.
 */
export interface UpdateCategoryRequest {
  /** Optimistic-concurrency token echoed from the category's last read. */
  readonly concurrencyStamp: string;
  readonly name: string | null;
  readonly iconName: string | null;
  readonly hideOnEntityCard: boolean | null;
}

export interface MoveCategoryRequest {
  /** `null` promotes the node to a scope root. */
  readonly newParentId: string | null;
}

export type CategoryAssignmentRequest = TaxonomyTargetRef;

export interface CategoryAssignmentResponse {
  readonly id: string;
  /** `null` for host-level assignments. */
  readonly tenantId: string | null;
  readonly categoryId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly assignedAt: ISODateString;
  readonly assignedByUserId: string;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export interface TaxonomySearchFilter {
  readonly q: string;
  /** Pass `'*'` for cross-scope search; omit to restrict to a single scope. */
  readonly scope?: string;
  readonly skip?: number;
  readonly take?: number;
}

export interface TaxonomySearchResultItem {
  readonly targetType: string;
  readonly targetId: string;
  /**
   * Human-readable label for the hit. The backend search envelope describes
   * targets by id + matched tags only, so the label is resolved from the
   * matched tags' names (joined). Apps that fan out to entity stores can
   * surface a richer label by wrapping the search bar.
   */
  readonly label: string;
  readonly snippet: string | null;
  readonly matchedTagIds: readonly string[];
  readonly matchedCategoryId: string | null;
}

export interface TaxonomySearchResultGroup {
  readonly targetType: string;
  readonly items: readonly TaxonomySearchResultItem[];
}

/**
 * Grouped search results plus the server-side pagination window the backend
 * echoes back (`totalCount`/`skip`/`take`). For legacy bare-array responses
 * (older mocks / fixtures) the counts are derived from the flattened items
 * and `skip`/`take` are `null`.
 */
export interface TaxonomySearchResult {
  readonly groups: readonly TaxonomySearchResultGroup[];
  readonly totalCount: number;
  readonly skip: number | null;
  readonly take: number | null;
}

// ─── Search — backend wire envelope (`SearchResponse`) ───────────────────────

/**
 * A matched tag, returned flat in {@link SearchResponse.tags}. Hits reference
 * tags by id (see {@link SearchHit.tagIds}); the front joins them by id to
 * resolve labels. Mirrors the spec `SearchTagItem` (all fields required).
 */
export interface SearchTagItem {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly scope: string;
}

/**
 * A single target match within a target-type bucket. Mirrors the spec
 * `SearchHit` (both fields required). `tagIds` index into
 * {@link SearchResponse.tags}.
 */
export interface SearchHit {
  readonly targetId: string;
  readonly tagIds: readonly string[];
}

/**
 * Wire shape of `GET {basePath}/search`. Mirrors the spec `SearchResponse`
 * (all fields required): the matched tags flat list, a per-target-type
 * dictionary of hits, and the pagination window.
 */
export interface SearchResponse {
  readonly tags: readonly SearchTagItem[];
  readonly hits: Readonly<Record<string, readonly SearchHit[]>>;
  readonly totalCount: number;
  readonly skip: number;
  readonly take: number;
}
