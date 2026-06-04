# @granit/react-cms-hostnames

React Query hooks and provider for CMS hostname management.

## Overview

- **`CmsHostnamesProvider`** — injects the Axios instance and site context via React context
- **`useCmsHostnamesConfig`** — reads the resolved config from context
- **`useSiteHostnames`** — query hook for listing managed hostnames
- **`useSiteHostnameAvailability`** — query hook for checking hostname availability
- **`useAddSiteHostname`** / **`useRemoveSiteHostname`** — mutation hooks for adding/removing
- **`useSetSiteHostnamePrimary`** / **`useClearSiteHostnamePrimary`** — primary hostname mutations
- **`useVerifySiteHostname`** — triggers DNS verification
- **`cmsHostnamesKeys`** — React Query key factory (for manual invalidation)

## Peer dependencies

- `react ^19`
- `@tanstack/react-query ^5`
- `@granit/cms-hostnames workspace:*`

## Usage

```tsx
import { CmsHostnamesProvider, useSiteHostnames } from '@granit/react-cms-hostnames';

function App() {
  return (
    <CmsHostnamesProvider axios={axiosInstance} siteId={siteId}>
      <HostnameList />
    </CmsHostnamesProvider>
  );
}

function HostnameList() {
  const { data } = useSiteHostnames();
  return <ul>{data?.map(h => <li key={h.id}>{h.hostname}</li>)}</ul>;
}
```
