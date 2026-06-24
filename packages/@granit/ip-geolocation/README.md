# @granit/ip-geolocation

Geolocation **contract** for the Granit framework — the framework-agnostic
TypeScript mirror of the .NET `Granit.IpGeolocation.GeoLocation` shape.

This is a **type-only core** package: it exports the single shared `GeoLocation`
interface and nothing else — no React, DOM, Node or runtime dependency, no HTTP
client, no hooks. It exists so every front-end surface that renders an
IP-resolved location (BFF sessions, identity sessions and devices) shares one
canonical shape instead of maintaining divergent per-package copies. The
authoritative producer is the backend `Granit.IpGeolocation` module; there is no
standalone geolocation HTTP endpoint and therefore no `contracts/openapi`
spec — `GeoLocation` travels embedded in other modules' responses (for example
`@granit/identity` session DTOs).

There is no `react-ip-geolocation` hooks layer and no `react-ui-ip-geolocation`
admin feature kit: a pure contract has nothing to wrap. Consumers import the type
directly. `@granit/identity` re-exports it and embeds it in its
`user-session`/device types; the related shared-contract sibling is
[`@granit/identity-abstractions`](../identity-abstractions).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. The
package declares **no** runtime, peer or dev dependencies: it is erased at
compile time, so importing it adds nothing to a consumer's bundle.

```ts
import type { GeoLocation } from '@granit/ip-geolocation';
```

The package also ships a `tsup` build (`dist/` + `publishConfig` →
`npm.pkg.github.com`) for the rare external consumer that needs the published
declaration; in-repo, the source `src/index.ts` barrel is the API surface.

## Quick start

`GeoLocation` is source-agnostic and every member is independently nullable: a
provider populates only what its data source supports (an offline country-only
database leaves `city`, `region` and the coordinates `null`). Render the strings
as **text** — never as HTML.

```tsx
import type { GeoLocation } from '@granit/ip-geolocation';

// Typically reached embedded in a richer DTO, e.g. an identity session:
//   session.location: GeoLocation | null
function LocationLabel({ location }: { location: GeoLocation | null }) {
  if (!location) return <span>Unknown location</span>;

  // Build a coarse-to-fine label from whatever the provider resolved.
  const parts = [location.city, location.region, location.country].filter(
    (part): part is string => part !== null,
  );

  // Plain text only — these strings come from an external geolocation source.
  return <span>{parts.join(', ') || location.countryCode || 'Unknown'}</span>;
}
```

```ts
// Coordinates are present only when the source resolves them.
function hasCoordinates(
  location: GeoLocation,
): location is GeoLocation & { latitude: number; longitude: number } {
  return location.latitude !== null && location.longitude !== null;
}
```

## Public API

| Symbol        | Kind | Purpose                                                    |
| ------------- | ---- | ---------------------------------------------------------- |
| `GeoLocation` | type | Approximate IP-derived location; mirrors the backend shape |

`GeoLocation` members, all `readonly` and independently nullable:

| Member        | Type             | Purpose                                           |
| ------------- | ---------------- | ------------------------------------------------- |
| `city`        | `string \| null` | City name when resolved to city granularity       |
| `region`      | `string \| null` | Most specific subdivision (region/state/province) |
| `country`     | `string \| null` | Country display name                              |
| `countryCode` | `string \| null` | ISO 3166-1 alpha-2 country code                   |
| `latitude`    | `number \| null` | Approximate latitude, decimal degrees             |
| `longitude`   | `number \| null` | Approximate longitude, decimal degrees            |

## Caveats

- **Display-only, untrusted strings.** `city`/`region`/`country` originate from
  an external geolocation data source. Render them as text; never inject them
  into a DOM script sink (`.innerHTML`, etc.). They carry no formatting
  guarantees.
- **Every member is independently optional.** Nullability is per-field, not
  all-or-nothing — `countryCode` may be set while `city` and the coordinates are
  `null`. Always narrow before use; do not assume coordinates accompany a
  country.
- **Approximate, not precise.** IP geolocation yields a coarse, best-effort
  location (often city/region level); it is not a GPS fix and must not be treated
  as one for any accuracy-sensitive decision.

## Out of scope

- **Resolution / lookup.** This package carries only the shape. Resolving an IP
  to a `GeoLocation` happens server-side in the backend `Granit.IpGeolocation`
  module; there is no client-side lookup API here.
- **Transport.** `GeoLocation` is never fetched on its own — it arrives embedded
  in another module's response (e.g. `@granit/identity` sessions/devices). No
  HTTP client, query key or hook lives in this package.

## License

Apache-2.0
