import { toEntityId, toISODateString } from '@granit/types';

import type {
  ApplicationLocalizationResponse,
  LanguageInfo,
  LocalizationOverride,
} from '@granit/localization';
import type { Mutable } from '@granit/testing';

export const mockLanguages: LanguageInfo[] = [
  {
    cultureName: 'en',
    displayName: 'English',
    flagIcon: '',
    isDefault: true,
  },
  {
    cultureName: 'fr',
    displayName: 'Français',
    flagIcon: '',
    isDefault: false,
  },
  {
    cultureName: 'nl',
    displayName: 'Nederlands',
    flagIcon: '',
    isDefault: false,
  },
];

const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'auth.login': 'Sign in',
    'auth.logout': 'Sign out',
  },
  fr: {
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'auth.login': 'Se connecter',
    'auth.logout': 'Se déconnecter',
  },
  nl: {
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'auth.login': 'Inloggen',
    'auth.logout': 'Uitloggen',
  },
};

/**
 * Build a mock localization response for a given culture.
 */
export function buildMockLocalization(cultureName: string): ApplicationLocalizationResponse {
  const resources = MOCK_TRANSLATIONS[cultureName] ?? MOCK_TRANSLATIONS['en'];
  return {
    cultureName,
    resources: { app: resources } as Record<string, Record<string, string>>,
    languages: mockLanguages,
  };
}

export const mockLocalizationOverrides: Mutable<LocalizationOverride>[] = [
  {
    id: toEntityId<'LocalizationOverride'>('1'),
    tenantId: null,
    resourceName: 'Showcase',
    cultureName: 'fr',
    key: 'common.save',
    value: 'Sauvegarder',
    createdAt: toISODateString('2026-03-01T10:00:00Z'),
    createdBy: 'admin@granit-showcase.local',
    modifiedAt: toISODateString('2026-03-01T10:00:00Z'),
    modifiedBy: 'admin@granit-showcase.local',
  },
  {
    id: toEntityId<'LocalizationOverride'>('2'),
    tenantId: null,
    resourceName: 'Showcase',
    cultureName: 'fr',
    key: 'common.cancel',
    value: 'Abandonner',
    createdAt: toISODateString('2026-03-01T10:00:00Z'),
    createdBy: 'admin@granit-showcase.local',
    modifiedAt: toISODateString('2026-03-01T10:00:00Z'),
    modifiedBy: 'admin@granit-showcase.local',
  },
  {
    id: toEntityId<'LocalizationOverride'>('3'),
    tenantId: null,
    resourceName: 'Showcase',
    cultureName: 'en',
    key: 'common.save',
    value: 'Save changes',
    createdAt: toISODateString('2026-03-02T09:00:00Z'),
    createdBy: 'admin@granit-showcase.local',
    modifiedAt: toISODateString('2026-03-02T09:00:00Z'),
    modifiedBy: 'admin@granit-showcase.local',
  },
  {
    id: toEntityId<'LocalizationOverride'>('4'),
    tenantId: null,
    resourceName: 'Granit',
    cultureName: 'fr',
    key: 'auth.login',
    value: 'Se connecter',
    createdAt: toISODateString('2026-03-05T14:00:00Z'),
    createdBy: 'admin@granit-showcase.local',
    modifiedAt: toISODateString('2026-03-05T14:00:00Z'),
    modifiedBy: 'admin@granit-showcase.local',
  },
  {
    id: toEntityId<'LocalizationOverride'>('5'),
    tenantId: null,
    resourceName: 'Granit',
    cultureName: 'fr',
    key: 'auth.logout',
    value: 'Se déconnecter',
    createdAt: toISODateString('2026-03-05T14:00:00Z'),
    createdBy: 'admin@granit-showcase.local',
    modifiedAt: toISODateString('2026-03-05T14:00:00Z'),
    modifiedBy: 'admin@granit-showcase.local',
  },
];
