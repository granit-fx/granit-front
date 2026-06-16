// ---------------------------------------------------------------------------
// @granit/react-data-lookup/testing — default mock data
// ---------------------------------------------------------------------------
//
// Generic sample sources used by createLookupHandlers when a consumer does not
// supply its own. Apps (e.g. granit-showcase-react) pass domain-specific
// sources instead, keeping their seed data in the app while reusing the handler
// plumbing shipped here.

import type { LookupItemResponse, LookupManifestResponse } from '@granit/data-lookup';

/** Sample reference-data source: ISO country codes with localized-ish labels. */
export const mockCountries: readonly LookupItemResponse[] = [
  { value: 'BE', label: 'Belgium', extra: null },
  { value: 'FR', label: 'France', extra: null },
  { value: 'DE', label: 'Germany', extra: null },
  { value: 'NL', label: 'Netherlands', extra: null },
];

/** Default source map keyed by registry name. */
export const mockLookupSources: Readonly<Record<string, readonly LookupItemResponse[]>> = {
  countries: mockCountries,
};

/** Default manifest mirroring {@link mockLookupSources}. */
export const mockLookupManifest: LookupManifestResponse = {
  lookups: [{ name: 'countries', kind: 'ReferenceData', requiredPermission: null, scopeKeys: [] }],
};
