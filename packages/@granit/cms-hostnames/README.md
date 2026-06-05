# @granit/cms-hostnames

Core (framework-agnostic) package for CMS hostname management.

## Overview

- **`listSiteHostnames`** / **`addSiteHostname`** / **`removeSiteHostname`** — CRUD
  operations for managed hostnames on a CMS site
- **`checkSiteHostnameAvailability`** — checks whether a hostname can be claimed
- **`verifySiteHostname`** — triggers DNS re-verification for a hostname
- Exports the narrow, site-scoped CMS DTOs (`SiteHostnameResponse`,
  `SiteHostnameAvailabilityResponse`, `SiteHostnameDnsRecordResponse`,
  `SiteHostnameCreateRequest`) mirroring `Granit.Cms.Hostnames.Endpoints`

## Peer dependencies

- `@granit/api-client workspace:*`

## Usage

```ts
import { listSiteHostnames, addSiteHostname } from '@granit/cms-hostnames';

const hostnames = await listSiteHostnames(axiosInstance, basePath, siteId);
await addSiteHostname(axiosInstance, basePath, siteId, { host: 'example.com' });
```
