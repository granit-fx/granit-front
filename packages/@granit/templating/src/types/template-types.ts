import type { AxiosInstance } from '@granit/api-client';
import type { PaginationParams } from '@granit/query-engine';
import type { EntityId, ISODateString } from '@granit/types';

// ── Template lifecycle status ─────────────────────────────────────────────────

/**
 * Numeric const for query-engine list context.
 * The QE list endpoint projects WorkflowLifecycleStatus as Int32.
 * Use this for TemplateListItem.currentStatus comparisons and QE filter params.
 */
export const TemplateLifecycleStatus = {
  Draft: 0,
  PendingReview: 1,
  Published: 2,
  Archived: 3,
} as const;

export type TemplateLifecycleStatusValue =
  (typeof TemplateLifecycleStatus)[keyof typeof TemplateLifecycleStatus];

/**
 * String literal union matching the OpenAPI WorkflowLifecycleStatus schema.
 * Used for detail / lifecycle / revision endpoints which serialize as strings.
 */
export type WorkflowLifecycleStatus = 'Draft' | 'PendingReview' | 'Published' | 'Archived';

// ── Template key ─────────────────────────────────────────────────────────────

export type TemplateKey = {
  readonly name: string;
  readonly culture?: string;
};

// ── Branded identifiers ───────────────────────────────────────────────────────

/** Branded template revision identifier. */
export type TemplateRevisionId = EntityId<'TemplateRevision'>;

/** Branded template category identifier. */
export type TemplateCategoryId = EntityId<'TemplateCategory'>;

// ── Revision ─────────────────────────────────────────────────────────────────

export type TemplateRevision = {
  readonly revisionId: TemplateRevisionId;
  readonly content: string;
  readonly mimeType: string;
  readonly status: WorkflowLifecycleStatus;
  readonly layoutName: string | null;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly publishedAt: ISODateString | null;
  readonly publishedBy: string | null;
  readonly concurrencyStamp: string;
};

export type TemplateRevisionSummary = {
  readonly revisionId: TemplateRevisionId;
  readonly status: WorkflowLifecycleStatus;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly publishedAt: ISODateString | null;
  readonly publishedBy: string | null;
  readonly contentLength: number;
};

// ── List ──────────────────────────────────────────────────────────────────────

export type TemplateListItem = {
  readonly tenantId?: string | null;
  readonly name: string;
  readonly culture: string | null;
  /** Category name — projected by the query engine via JOIN; not in the base TemplateSummary DTO. */
  readonly category?: string;
  readonly layoutName?: string | null;
  readonly currentStatus: TemplateLifecycleStatusValue;
  readonly mimeType: string;
  readonly lastModifiedAt: ISODateString;
  readonly lastModifiedBy: string;
  readonly hasPublishedVersion: boolean;
};

export type TemplateListParams = PaginationParams & {
  readonly search?: string;
  readonly status?: TemplateLifecycleStatusValue;
  readonly categoryId?: TemplateCategoryId;
  readonly culture?: string;
};

// ── Detail ───────────────────────────────────────────────────────────────────

export type TemplateDetail = {
  readonly name: string;
  readonly culture: string | null;
  readonly layoutName: string | null;
  readonly draft: TemplateRevision | null;
  readonly published: TemplateRevision | null;
};

// ── Save ──────────────────────────────────────────────────────────────────────

export type SaveTemplateRequest = {
  readonly name?: string | null;
  readonly culture?: string | null;
  readonly content: string;
  readonly mimeType?: string;
  readonly layoutName?: string | null;
  /** Optimistic concurrency stamp from the current draft revision. Pass when updating. */
  readonly concurrencyStamp?: string | null;
};

// ── Lifecycle ────────────────────────────────────────────────────────────────

export type TemplateLifecycle = {
  readonly name: string;
  readonly culture: string | null;
  readonly currentStatus: WorkflowLifecycleStatus;
  readonly workflowEnabled: boolean;
  readonly availableTransitions: readonly WorkflowLifecycleStatus[];
};

// ── Preview ──────────────────────────────────────────────────────────────────

export type TemplatePreviewRequest = {
  readonly culture?: string | null;
  /** Arbitrary JSON value passed as template data (object, array, string, number, boolean, or null). */
  readonly data?: unknown;
};

export type TemplatePreviewResponse = {
  readonly html: string;
  readonly revisionId: string | null;
  readonly renderTimeMs: number;
};

/** Frontend-only error model for template parse errors. Not a backend DTO. */
export type TemplateParseError = {
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly snippet?: string;
};

// ── Variables ────────────────────────────────────────────────────────────────

export type TemplateVariable = {
  readonly name: string;
  readonly type: string;
  readonly description: string | null;
};

export type TemplateVariables = {
  readonly globalVariables: readonly TemplateVariable[];
  readonly modelVariables: readonly TemplateVariable[];
  readonly enrichedVariables: readonly TemplateVariable[];
};

// ── Categories ───────────────────────────────────────────────────────────────

export type TemplateCategory = {
  readonly id: TemplateCategoryId;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly sortOrder: number;
  readonly templateCount: number;
};

export type SaveTemplateCategoryRequest = {
  readonly name: string;
  readonly description?: string | null;
  readonly icon?: string | null;
  readonly sortOrder?: number;
};

// ── History (paginated) ──────────────────────────────────────────────────────

export type TemplateHistory = {
  readonly revisions: readonly TemplateRevisionSummary[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
};

// ── Configuration ────────────────────────────────────────────────────────────

export type TemplatingConfig = {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
};
