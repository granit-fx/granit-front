# @granit/ip-geolocation

Geolocation contract for the Granit framework — the TypeScript mirror of
`Granit.IpGeolocation.GeoLocation`.

A type-only package: it exposes the shared `GeoLocation` shape consumed by every
front-end surface that displays an IP-resolved location (BFF sessions, identity
sessions and devices). Keeping it standalone — mirroring the backend
`Granit.IpGeolocation` module — prevents divergent per-package copies.

## Usage

```ts
import type { GeoLocation } from '@granit/ip-geolocation';
```
