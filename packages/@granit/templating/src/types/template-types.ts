import type { PaginationParams } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

// ── Template lifecycle status (mirrors .NET Granit.Templating.Domain.TemplateLifecycleStatus) ──

export const TemplateLifecycleStatus = {
  Draft: 0,
  PendingReview: 1,
  Published: 2,
  Archived: 3,
} as const;

export type TemplateLifecycleStatusValue =
  (typeof TemplateLifecycleStatus)[keyof typeof TemplateLifecycleStatus];

// ── Document format ──

export const DocumentFormat = {
  Html: 0,
  Pdf: 1,
  Excel: 2,
} as const;

export type DocumentFormatValue = (typeof DocumentFormat)[keyof typeof DocumentFormat];

// ── Template key ──

export type TemplateKey = {
  readonly name: string;
  readonly culture?: string;
};

// ── Revision ──

export type TemplateRevision = {
  readonly revisionId: string;
  readonly content: string;
  readonly mimeType: string;
  readonly status: TemplateLifecycleStatusValue;
  readonly layoutName: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly publishedAt?: string;
  readonly publishedBy?: string;
};

export type TemplateRevisionSummary = Omit<TemplateRevision, 'content' | 'mimeType'> & {
  readonly contentLength: number;
};

// ── List ──

export type TemplateListItem = {
  readonly name: string;
  readonly culture?: string;
  readonly category?: string;
  readonly layoutName: string | null;
  readonly currentStatus: TemplateLifecycleStatusValue;
  readonly mimeType: string;
  readonly lastModifiedAt: string;
  readonly lastModifiedBy: string;
  readonly hasPublishedVersion: boolean;
};

export type TemplateListParams = PaginationParams & {
  readonly search?: string;
  readonly status?: TemplateLifecycleStatusValue;
  readonly categoryId?: string;
  readonly culture?: string;
};

// ── Detail ──

export type TemplateDetail = {
  readonly name: string;
  readonly culture?: string;
  readonly category?: string;
  readonly layoutName: string | null;
  readonly draft?: TemplateRevision;
  readonly published?: TemplateRevision;
};

// ── Save ──

export type SaveTemplateRequest = {
  readonly name: string;
  readonly culture?: string;
  readonly content: string;
  readonly mimeType?: string;
  readonly category?: string;
  readonly layoutName?: string | null;
};

// ── Lifecycle ──

export type TemplateLifecycle = {
  readonly name: string;
  readonly culture?: string;
  readonly currentStatus: TemplateLifecycleStatusValue;
  readonly workflowEnabled: boolean;
  readonly availableTransitions: readonly TemplateLifecycleStatusValue[];
};

// ── Preview ──

export type TemplatePreviewRequest = {
  readonly culture?: string;
  readonly format?: DocumentFormatValue;
  readonly data?: Record<string, unknown>;
};

export type TemplatePreviewResponse = {
  readonly html: string;
  readonly plainText?: string;
  readonly subject?: string;
  readonly revisionId: string;
  readonly renderTimeMs: number;
};

export type TemplateParseError = {
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly snippet?: string;
};

// ── Variables ──

export type TemplateVariable = {
  readonly name: string;
  readonly type: string;
  readonly description?: string;
  readonly example?: string;
};

export type TemplateVariables = {
  readonly globalVariables: readonly TemplateVariable[];
  readonly modelVariables: readonly TemplateVariable[];
  readonly enrichedVariables: readonly TemplateVariable[];
};

// ── Categories ──

export type TemplateCategory = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly sortOrder: number;
  readonly templateCount: number;
};

export type SaveTemplateCategoryRequest = {
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly sortOrder?: number;
};

// ── History (paginated) ──

export type TemplateHistory = {
  readonly revisions: readonly TemplateRevisionSummary[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
};

// ── Configuration ──

export type TemplatingConfig = {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
};
