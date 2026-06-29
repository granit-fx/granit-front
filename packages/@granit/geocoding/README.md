# @granit/geocoding

Framework-agnostic **geocoding** SDK — the TypeScript counterpart of the .NET
`Granit.Geocoding` module (`granit-dotnet/src/Granit.Geocoding.Endpoints`).

It exposes the wire types and HTTP client functions for the two
**capability-gated** geocoding endpoints:

- `getAddressSuggestions` → `GET {basePath}/autocomplete` — ranked address
  suggestions for a partial query (typeahead).
- `getReverseGeocode` → `GET {basePath}/reverse` — the postal address nearest a
  latitude/longitude (the data half of a map pin-drop).

It holds **no** React, DOM or Node-only dependency. The React layer (provider,
hooks, `AddressAutocompleteInput`) lives in
[`@granit/react-geocoding`](../react-geocoding).

## Capability gating

Both endpoints are mapped on the backend **only when a capable provider is
installed**. When absent, the route 404s — callers should treat that as
"feature unavailable, fall back to manual entry", never a hard error. The
autocomplete endpoint is **high-volume** (per-keystroke) and the upstream
provider quota is shared and billable: always debounce before calling it (the
React hook does this for you) and let the backend rate-limit per principal.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
the peer:

- `@granit/api-client` — the centralized Axios client (`AxiosInstance`) every
  call takes as its first argument (interceptors: CSRF, auth, tenant).

## Quick start

```ts
import { getAddressSuggestions, getReverseGeocode } from '@granit/geocoding';
import type { AxiosInstance } from '@granit/api-client';

const basePath = '/api/v1/geocoding';

// Typeahead — pass an AbortSignal to cancel an in-flight request.
const { suggestions } = await getAddressSuggestions(
  client,
  basePath,
  { q: 'rue de la loi', limit: 5 },
  controller.signal
);

// Reverse — handle 404 (no match / not mapped) and 422 (out of range) quietly.
const address = await getReverseGeocode(client, basePath, { lat: 50.8467, lon: 4.3676 });
```

## Types

Hand-written to mirror the backend DTOs field-for-field; conformance against
`contracts/openapi/geocoding.json` is enforced by `@granit/contract-tests`.

- `GeocodingSuggestionResponse` — `label`, structured components
  (`street`/`postalCode`/`locality`/`country`, nullable where the provider gave
  none) and optional `latitude`/`longitude`.
- `GeocodingAutocompleteResponse` — `{ suggestions }`.
- `GeocodingReverseResponse` — structured components + `precision`
  (`GeocodeMatchPrecision`: `Rooftop` | `Street` | `Locality`).
