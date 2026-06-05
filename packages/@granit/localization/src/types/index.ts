import type { EntityId, ISODateString } from '@granit/types';
import type { Module } from 'i18next';

/** Matches backend Granit.Localization.LanguageInfo. */
export interface LanguageInfo {
  cultureName: string;
  displayName: string;
  flagIcon?: string;
  isDefault: boolean;
}

/** Matches backend Granit.Localization.Endpoints.Dtos.ApplicationLocalizationResponse. */
export interface ApplicationLocalizationResponse {
  cultureName: string;
  resources: Record<string, Record<string, string>>;
  languages: LanguageInfo[];
}

/**
 * @deprecated Renamed to {@link ApplicationLocalizationResponse} to mirror the
 * backend DTO name. Kept as an alias for backward compatibility; will be
 * removed in a future major version.
 */
export type ApplicationLocalizationDto = ApplicationLocalizationResponse;

// ── Admin types ─────────────────────────────────────────────────────────────

/** Branded localization override identifier. */
export type LocalizationOverrideId = EntityId<'LocalizationOverride'>;

/**
 * Localization override record for admin translation management.
 *
 * Mirrors `Granit.Localization.Domain.LocalizationOverride` (an `AuditedEntity`,
 * `IMultiTenant`). Audit fields are `modifiedAt` / `modifiedBy` (from
 * `AuditedEntity`), not `lastModified*`.
 */
export interface LocalizationOverride {
  readonly id: LocalizationOverrideId;
  /** Tenant scope. `null` = host-level override (applies to all tenants). */
  readonly tenantId: string | null;
  readonly resourceName: string;
  readonly cultureName: string;
  readonly key: string;
  readonly value: string;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly modifiedAt: ISODateString | null;
  readonly modifiedBy: string | null;
}

export interface LocalizationConfig {
  /** localStorage key for locale persistence (default: 'locale' → dd:locale). */
  storageKey?: string;
  /** i18next default namespace (default: 'translation'). */
  defaultNS?: string;
  /** i18next plugins to register (e.g. initReactI18next for React integration). */
  plugins?: Module[];
}
