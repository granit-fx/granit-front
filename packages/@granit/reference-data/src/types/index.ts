import type { PaginationParams } from '@granit/query-engine';
import type { EntityId, ISODateString } from '@granit/types';

/** The 14 multilingual labels supported by Granit reference data. */
export interface ReferenceDataLabels {
  readonly labelEn: string;
  readonly labelFr: string;
  readonly labelNl: string;
  readonly labelDe: string;
  readonly labelEs: string;
  readonly labelIt: string;
  readonly labelPt: string;
  readonly labelZh: string;
  readonly labelJa: string;
  readonly labelPl: string;
  readonly labelTr: string;
  readonly labelKo: string;
  readonly labelSv: string;
  readonly labelCs: string;
}

/**
 * Base interface for all reference data entries.
 * Mirrors Granit.ReferenceData.Endpoints.Dtos.ReferenceDataResponse (.NET).
 *
 * Concrete entity types (Country, Currency, Language, etc.) extend this
 * interface with domain-specific fields in the consuming application.
 */
/** Branded reference data entry identifier. */
export type ReferenceDataEntryId = EntityId<'ReferenceDataEntry'>;

export interface ReferenceDataEntry extends ReferenceDataLabels {
  readonly id: ReferenceDataEntryId;
  readonly code: string;
  /** Resolved label for the current UI culture (server-computed, not persisted). */
  readonly label: string;
  readonly activated: boolean;
  readonly sortOrder: number;
  readonly validFrom: ISODateString | null;
  readonly validTo: ISODateString | null;
  /** Parent code for hierarchical types (null for root entries). */
  readonly parentCode: string | null;
  /** Custom properties bag (all values are strings). */
  readonly extraProperties: Record<string, string> | null;
}

/**
 * Request body for creating a new reference data entry.
 * Mirrors Granit.ReferenceData.Endpoints.Dtos.ReferenceDataCreateRequest (.NET).
 *
 * Only `code` and `labelEn` are required. `activated` is always `true` on creation.
 */
export interface ReferenceDataCreateRequest extends Partial<ReferenceDataLabels> {
  readonly code: string;
  readonly labelEn: string;
  readonly sortOrder?: number;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly parentCode?: string | null;
  readonly extraProperties?: Record<string, string> | null;
}

/**
 * Request body for updating an existing reference data entry.
 * Mirrors Granit.ReferenceData.Endpoints.Dtos.ReferenceDataUpdateRequest (.NET).
 *
 * `code` is immutable and passed as a path parameter, not in the body.
 */
export interface ReferenceDataUpdateRequest extends Partial<ReferenceDataLabels> {
  readonly labelEn: string;
  readonly sortOrder?: number;
  readonly activated?: boolean;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly parentCode?: string | null;
  readonly extraProperties?: Record<string, string> | null;
}

/**
 * Query parameters for listing reference data entries.
 * Mirrors Granit.ReferenceData.Endpoints.Dtos.ReferenceDataQueryParameters (.NET).
 */
export interface ReferenceDataQuery extends PaginationParams {
  /** When true, only active entries are returned. Default: true. */
  readonly activeOnly?: boolean;
  /** Free-text search on code and labels. */
  readonly search?: string;
  /** Property to sort by (e.g., 'SortOrder', 'Code', 'Label'). Default: 'SortOrder'. */
  readonly sortBy?: string;
  /** Sort in descending order. Default: false. */
  readonly descending?: boolean;
}
