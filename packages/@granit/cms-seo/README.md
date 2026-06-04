# @granit/cms-seo

Core (framework-agnostic) package for CMS SEO management.

## Overview

### Public / renderer

- **`getEffectiveSeo`** — fetches the resolved SEO metadata for a page (used by
  the renderer to populate `<head>`)

### Admin API

- **`getSeoMetadata`** / **`upsertSeoMetadata`** / **`deleteSeoMetadata`** — per-page SEO management
- **`getSeoDefaults`** / **`updateSeoDefaults`** — site-wide SEO defaults
- **`listSeoAuditIssues`** — SEO audit results
- **`getSerpPreview`** / **`getOgCardPreview`** / **`getJsonLdPreview`** — live previews
- **`invalidateSitemap`** — triggers sitemap regeneration

### SEO-AI

- **`suggestSeo`** / **`listSeoSuggestions`** / **`applySeoSuggestion`** /
  **`rejectSeoSuggestion`** / **`getSeoSuggestionDiff`** / **`triggerBulkSeoAudit`**

## Peer dependencies

- `@granit/api-client workspace:*`

## Usage

```ts
import { getEffectiveSeo, upsertSeoMetadata } from '@granit/cms-seo';

const seo = await getEffectiveSeo(axiosInstance, siteId, pageId, culture);
await upsertSeoMetadata(axiosInstance, siteId, pageId, payload);
```
