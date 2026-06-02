# @granit/react-cms-seo

React Query hooks and provider for CMS SEO management.

## Overview

- **`CmsSeoProvider`** — injects the Axios instance and site context via React context
- **`useCmsSeoConfig`** — reads the resolved config from context
- **`useSeoMetadata`** / **`useSeoDefaults`** — query hooks for SEO data
- **`useSerpPreview`** / **`useOgCardPreview`** / **`useJsonLdPreview`** — live preview query hooks
- **`useSeoAuditIssues`** — query hook for SEO audit results
- **`useUpsertSeoMetadata`** / **`useDeleteSeoMetadata`** — per-page SEO mutation hooks
- **`useUpdateSeoDefaults`** / **`useInvalidateSitemap`** — site-level mutation hooks
- **`useSeoSuggestions`** / **`useSuggestSeo`** / **`useApplySeoSuggestion`** /
  **`useRejectSeoSuggestion`** / **`useSeoSuggestionDiff`** / **`useTriggerBulkSeoAudit`** — SEO-AI hooks
- **`cmsSeoKeys`** — React Query key factory (for manual invalidation)

## Peer dependencies

- `react ^19`
- `@tanstack/react-query ^5`
- `@granit/cms-seo workspace:*`

## Usage

```tsx
import { CmsSeoProvider, useSeoMetadata, useUpsertSeoMetadata } from '@granit/react-cms-seo';

function App() {
  return (
    <CmsSeoProvider axios={axiosInstance} siteId={siteId}>
      <SeoEditor pageId={pageId} />
    </CmsSeoProvider>
  );
}

function SeoEditor({ pageId }: { pageId: string }) {
  const { data } = useSeoMetadata(pageId);
  const { mutate: upsert } = useUpsertSeoMetadata();
  return <>{/* ... */}</>;
}
```
