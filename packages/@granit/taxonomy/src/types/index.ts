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
  readonly scope: string;
  readonly name: string;
  readonly color: HexColor;
  readonly hideOnEntityCard: boolean;
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
  readonly hideOnEntityCard: boolean;
}

/**
 * PATCH payload for {@link TagResponse}. Every field is optional — only
 * supplied fields are mutated server-side.
 */
export interface UpdateTagRequest {
  readonly name?: string;
  readonly color?: HexColor;
  readonly hideOnEntityCard?: boolean;
}

export type TagAssignmentRequest = TaxonomyTargetRef;

export interface TagAssignmentResponse {
  readonly tagId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly assignedAt: string;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export interface CategoryResponse {
  readonly id: string;
  readonly scope: string;
  /** `null` when the node is a scope root. */
  readonly parentId: string | null;
  /** Materialised path, root-anchored, e.g. `"/legal/contracts/2026"`. */
  readonly path: string;
  readonly name: string;
  /** 0 for scope roots; one greater than the parent's depth otherwise. */
  readonly depth: number;
  readonly hasChildren: boolean;
}

/**
 * Single-category detail, augmented with the full breadcrumb (root → leaf,
 * inclusive of the queried node) for UI rendering without extra round-trips.
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
}

export interface UpdateCategoryRequest {
  readonly name?: string;
}

export interface MoveCategoryRequest {
  /** `null` promotes the node to a scope root. */
  readonly newParentId: string | null;
}

export type CategoryAssignmentRequest = TaxonomyTargetRef;

export interface CategoryAssignmentResponse {
  readonly categoryId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly assignedAt: string;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export interface TaxonomySearchFilter {
  readonly q: string;
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
