# @granit/cms-redirects

Core (framework-agnostic) package for CMS redirect management.

## Overview

- **`resolveRedirect`** — resolves an incoming path to its redirect target (renderer use)
- **`listRedirects`** / **`createRedirect`** / **`updateRedirect`** / **`deleteRedirect`** —
  full CRUD for admin redirect rules
- DTOs: `RedirectResponse`, `RedirectResolveResponse`, `CreateRedirectRequest`,
  `UpdateRedirectRequest`, `PagedResponse`

## Peer dependencies

- `@granit/api-client workspace:*`

## Usage

```ts
import { listRedirects, createRedirect } from '@granit/cms-redirects';

const page = await listRedirects(axiosInstance, siteId, { page: 1, pageSize: 20 });
await createRedirect(axiosInstance, siteId, { from: '/old', to: '/new', permanent: true });
```
