import type { EntityId, ISODateString } from '@granit/types';
import type { Module } from 'i18next';

/** Matches backend Granit.Localization.LanguageInfo. */
export interface LanguageInfo {
  cultureName: string;
  displayName: string;
  flagIcon?: string;
  isDefault: boolean;
}

/** Matches backend ApplicationLocalizationDto. */
export interface ApplicationLocalizationDto {
  cultureName: string;
  resources: Record<string, Record<string, string>>;
  languages: LanguageInfo[];
}

// ── Admin types ─────────────────────────────────────────────────────────────

/** Admin-scoped language with enable/disable capability. */
export interface AdminLanguage extends LanguageInfo {
  isEnabled: boolean;
  parentCulture?: string;
}

/** Branded localization override identifier. */
export type LocalizationOverrideId = EntityId<'LocalizationOverride'>;

/** Localization override record for admin translation management. */
export interface LocalizationOverride {
  readonly id: LocalizationOverrideId;
  readonly resourceName: string;
  readonly cultureName: string;
  readonly key: string;
  readonly value: string;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly lastModifiedAt: ISODateString | null;
  readonly lastModifiedBy: string | null;
}

export interface LocalizationConfig {
  /** localStorage key for locale persistence (default: 'locale' → dd:locale). */
  storageKey?: string;
  /** i18next default namespace (default: 'translation'). */
  defaultNS?: string;
  /** i18next plugins to register (e.g. initReactI18next for React integration). */
  plugins?: Module[];
}
