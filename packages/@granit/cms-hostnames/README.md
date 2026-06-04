# @granit/cms-hostnames

Core (framework-agnostic) package for CMS hostname management.

## Overview

- **`listSiteHostnames`** / **`addSiteHostname`** / **`removeSiteHostname`** — CRUD
  operations for managed hostnames on a CMS site
- **`checkSiteHostnameAvailability`** — checks whether a hostname can be claimed
- **`setSiteHostnamePrimary`** / **`clearSiteHostnamePrimary`** — primary-hostname management
- **`verifySiteHostname`** — triggers DNS verification for a pending hostname
- Re-exports `CertificateStatus`, `ManagedHostnameStatus` and related types from
  `@granit/hostnames` so consumers need only one import

## Peer dependencies

- `@granit/api-client workspace:*`

## Usage

```ts
import { listSiteHostnames, addSiteHostname } from '@granit/cms-hostnames';

const hostnames = await listSiteHostnames(axiosInstance, siteId);
await addSiteHostname(axiosInstance, siteId, { hostname: 'example.com' });
```
