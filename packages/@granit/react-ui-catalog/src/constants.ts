import type { ProductType } from '@granit/catalog';
import type { QueryConfig } from '@granit/query-engine';

/** Query-engine config for the products admin grid (`GET /catalog/products`). */
export const QUERY_CONFIG: QueryConfig = { basePath: '/api/v1/catalog/products' };

/** Default page size for the admin grid (mirrors ProductQueryDefinition). */
export const DEFAULT_PAGE_SIZE = 25;

/** Selectable product types. Mirrors `Granit.Catalog.Domain.ProductType`. */
export const PRODUCT_TYPES = [
  'Service',
  'Metered',
  'Physical',
  'Digital',
] as const satisfies readonly ProductType[];
