# @granit/react-query-engine

React bindings for `@granit/query-engine` -- QueryProvider, pagination hooks, data grid hooks.

## Installation

```bash
pnpm add @granit/react-query-engine
```

## API

### Components

- `QueryProvider` -- provides query configuration to the component tree

### Hooks -- pagination

- `useInfiniteScroll(options)` -- infinite scroll pagination
- `usePagination(options)` -- offset-based pagination

### Hooks -- data grid

- `useQueryEndpoint(options)` -- fetch data from a query endpoint with filters, sorting, pagination
- `useQueryMeta(options)` -- fetch metadata (available columns, filters) for a query endpoint
- `useSavedViews(options)` -- manage saved views (filters + column configurations)
- `useSmartFilter(options)` -- manage smart filter state

### Utilities

- `useQueryConfig()` -- access query configuration from context

### Types

- `QueryProviderProps` -- props for `QueryProvider`
- `UseQueryEndpointOptions`, `UseQueryEndpointReturn` -- query endpoint hook types
- `UsePaginationOptions`, `UsePaginationReturn`, `PaginationPage` -- pagination types
- `UseInfiniteScrollOptions`, `UseInfiniteScrollReturn`, `InfiniteScrollPage` -- infinite scroll types
- `UseSavedViewsReturn` -- saved views hook return type
- `UseSmartFilterOptions`, `UseSmartFilterReturn` -- smart filter hook types

## Usage

```tsx
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';

function App() {
  return (
    <QueryProvider config={{ basePath: '/api' }}>
      <DataGrid />
    </QueryProvider>
  );
}

function DataGrid() {
  const { data, isLoading } = useQueryEndpoint({
    endpoint: '/documents',
    filters: { status: 'active' },
  });

  return <table>{/* render data.items */}</table>;
}
```

## License

Apache-2.0
