# @granit/cms

Framework-agnostic TypeScript client for the Granit CMS HTTP API.

## Overview

Typed Axios wrappers for every CMS endpoint: page resolution, block catalog,
menus, redirects, SEO metadata, document batch resolution, and preview tokens.

## API surface

```ts
// Pages
getPageByPath(client, basePath, { siteId, culture, path });
mintPreviewToken(client, basePath, pageId, request);
resolvePreview(client, basePath, token);

// Blocks
getBlockCatalog(client, basePath);
resolveBlockData(client, basePath, request);

// Menus
resolveMenu(client, basePath, menuKey, culture);

// Redirects
resolveRedirect(client, basePath, { siteId, culture, path });

// SEO
getEffectiveSeo(client, basePath, params);

// Documents
batchResolveDocuments(client, basePath, request);
```

## Usage

All functions accept an `AxiosInstance` from `@granit/api-client` and a
`basePath` string (e.g. `https://api.example.com`). No configuration is
stored globally — the caller controls the client.
