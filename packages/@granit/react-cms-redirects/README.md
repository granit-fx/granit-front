# @granit/react-cms-redirects

React Query hooks and provider for CMS redirect management.

## Overview

- **`CmsRedirectsProvider`** — injects the Axios instance and site context via React context
- **`useCmsRedirectsConfig`** — reads the resolved config from context
- **`useRedirects`** — paginated query hook for listing redirects
- **`useCreateRedirect`** / **`useUpdateRedirect`** / **`useDeleteRedirect`** — mutation hooks
- **`cmsRedirectsKeys`** — React Query key factory (for manual invalidation)

## Peer dependencies

- `react ^19`
- `@tanstack/react-query ^5`
- `@granit/cms-redirects workspace:*`

## Usage

```tsx
import { CmsRedirectsProvider, useRedirects, useCreateRedirect } from '@granit/react-cms-redirects';

function App() {
  return (
    <CmsRedirectsProvider axios={axiosInstance} siteId={siteId}>
      <RedirectManager />
    </CmsRedirectsProvider>
  );
}

function RedirectManager() {
  const { data } = useRedirects({ page: 1, pageSize: 20 });
  const { mutate: create } = useCreateRedirect();
  return <>{/* ... */}</>;
}
```
