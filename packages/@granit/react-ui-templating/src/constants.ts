import type { QueryConfig } from '@granit/query-engine';
import type { TemplatingConfig } from '@granit/react-templating';

export const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/templating/templates',
};

// The Axios client is resolved from a `GranitClientProvider` higher in the tree
// (via `@granit/react-api-client`); no client is baked in here.
export const TEMPLATING_CONFIG: TemplatingConfig = {
  basePath: '/api/v1/templating',
  queryKeyPrefix: ['templates'],
};

export const DEFAULT_PAGE_SIZE = 20;
