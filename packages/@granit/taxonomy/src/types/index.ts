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
  /** Audit field — may be absent when the spec is extended; treat as informational. */
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TagListFilter {
  readonly scope: string;
  readonly q?: string;
}

export interface CreateTagRequest {
  readonly scope: string;
  readonly name: string;
  readonly color: HexColor;
  /** `null` lets the backend apply its default (false). */
  readonly hideOnEntityCard: boolean | null;
}

/**
 * PATCH payload for {@link TagResponse}. All fields are required-but-nullable
 * (OpenAPI `required` + `["null","T"]`): pass `null` to leave a field unchanged
 * server-side, pass a value to update it.
 */
export interface UpdateTagRequest {
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
  readonly assignedAt: string;
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
  /** Materialised path, root-anchored, e.g. `"/legal/contracts/2026"`. */
  readonly path: string;
  readonly name: string;
  /** 0 for scope roots; one greater than the parent's depth otherwise. */
  readonly depth: number;
  /** `null` when no icon is assigned. */
  readonly iconName: string | null;
  readonly hideOnEntityCard: boolean;
  /**
   * Derived field for tree-lazy-load: true when at least one child exists.
   * Not in the published OpenAPI spec but sent by the backend implementation.
   */
  readonly hasChildren: boolean;
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
  /** `null` to create a scope root. */
  readonly parentId: string | null;
  readonly name: string;
  /** `null` to create without an icon. */
  readonly iconName: string | null;
  /** `null` lets the backend apply its default (false). */
  readonly hideOnEntityCard: boolean | null;
}

/**
 * PATCH payload for {@link CategoryResponse}. All fields are required-but-nullable
 * (OpenAPI `required` + `["null","T"]`): pass `null` to leave a field unchanged.
 */
export interface UpdateCategoryRequest {
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
  readonly assignedAt: string;
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
  readonly label: string;
  readonly snippet: string | null;
  readonly matchedTagIds: readonly string[];
  readonly matchedCategoryId: string | null;
}

export interface TaxonomySearchResultGroup {
  readonly targetType: string;
  readonly items: readonly TaxonomySearchResultItem[];
}
