import { ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { created, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockProducts } from './data';

import type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductLifecycleStatus,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '@granit/catalog';
import type { QueryMetadata } from '@granit/query-engine';

let products: ProductResponse[] = [...mockProducts];

function findProductOrFail(id: string): ProductResponse | undefined {
  return products.find((p) => p.id === id);
}

let mappingCounter = 100;
function nextMappingId(): string {
  mappingCounter += 1;
  return `00000000-0000-0000-0000-${mappingCounter.toString().padStart(12, '0')}`;
}

let productCounter = 100;
function nextProductId(): string {
  productCounter += 1;
  return `00000000-0000-0000-0000-${productCounter.toString().padStart(12, '0')}`;
}

/** Maps a quick-filter name to the lifecycle status it selects. */
const QUICK_FILTER_TO_STATUS: Record<string, ProductLifecycleStatus> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

/** Accessors for the sortable string columns of the admin grid. */
const SORT_ACCESSORS: Record<string, (p: ProductResponse) => string> = {
  sku: (p) => p.sku,
  name: (p) => p.name,
  type: (p) => p.type,
  unit: (p) => p.unit,
  lifecycleStatus: (p) => p.lifecycleStatus,
};

/**
 * Mock `/meta` payload for the catalog products admin grid. Mirrors
 * `Granit.Catalog.Queries.ProductQueryDefinition` (full lifecycle, filterable
 * + sortable). Enum-backed columns (`type`, `lifecycleStatus`) are exposed as
 * the string names the `ProductResponse` DTO serializes.
 */
export const productQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'sku',
      label: 'SKU',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'String',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'unit',
      label: 'Unit',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lifecycleStatus',
      label: 'Lifecycle Status',
      type: 'String',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'sku', type: 'String', operators: STRING_OPERATORS },
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'description', type: 'String', operators: STRING_OPERATORS },
    { name: 'type', type: 'String', operators: ENUM_OPERATORS },
    { name: 'unit', type: 'String', operators: STRING_OPERATORS },
    { name: 'lifecycleStatus', type: 'String', operators: ENUM_OPERATORS },
  ],
  sortableFields: [
    { name: 'sku' },
    { name: 'name' },
    { name: 'type' },
    { name: 'unit' },
    { name: 'lifecycleStatus' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'draft', label: 'Draft', isDefault: false },
    { name: 'published', label: 'Published', isDefault: false },
    { name: 'archived', label: 'Archived', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'sku',
};

/**
 * Create stateful MSW handlers for catalog product endpoints.
 * Handlers mutate an in-memory store — mutations are reflected by subsequent GETs.
 * Call {@link resetCatalogMocks} between tests to restore the initial fixtures.
 *
 * @param baseUrl - API base path (default: `/api/v1/catalog`)
 */
export function createCatalogHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /catalog/products/meta → query-engine metadata for the admin grid.
    createQueryMetaHandler(`${baseUrl}/products`, productQueryMetadata),

    // GET /catalog/products → query-engine admin grid (paged, full lifecycle:
    // Draft / Published / Archived). Honours page / pageSize / search /
    // quickFilters / sort. Must precede the /products/:id route.
    http.get(`${baseUrl}/products`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      const search = url.searchParams.get('search')?.toLowerCase();
      const quickFilters = url.searchParams.get('quickFilters')?.split(',').filter(Boolean) ?? [];
      const sort = url.searchParams.get('sort')?.split(',')[0];

      let filtered = [...products];

      if (search) {
        filtered = filtered.filter(
          (p) =>
            p.sku.toLowerCase().includes(search) ||
            p.name.toLowerCase().includes(search) ||
            (p.description?.toLowerCase().includes(search) ?? false)
        );
      }

      if (quickFilters.length > 0) {
        const statuses = quickFilters
          .map((q) => QUICK_FILTER_TO_STATUS[q])
          .filter((s): s is ProductLifecycleStatus => Boolean(s));
        if (statuses.length > 0) {
          filtered = filtered.filter((p) => statuses.includes(p.lifecycleStatus));
        }
      }

      const descending = sort?.startsWith('-') ?? false;
      const sortField = sort ? (descending ? sort.slice(1) : sort) : 'sku';
      const accessor = SORT_ACCESSORS[sortField] ?? ((p: ProductResponse) => p.sku);
      filtered.sort((a, b) => {
        const cmp = accessor(a).localeCompare(accessor(b));
        return descending ? -cmp : cmp;
      });

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      return pagedResponse(items, filtered.length);
    }),

    // GET /catalog/products/active → active catalog (Published only).
    http.get(`${baseUrl}/products/active`, () => {
      const published = products.filter((p) => p.lifecycleStatus === 'Published');
      return HttpResponse.json({ items: published, totalCount: published.length });
    }),

    // GET /catalog/products/{id}
    http.get(`${baseUrl}/products/:id`, ({ params }) => {
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(product);
    }),

    // GET /catalog/products/by-sku/{sku}
    http.get(`${baseUrl}/products/by-sku/:sku`, ({ params }) => {
      const product = products.find((p) => p.sku === params.sku);
      if (!product) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(product);
    }),

    // POST /catalog/products (Draft)
    http.post(`${baseUrl}/products`, async ({ request }) => {
      const body = (await request.json()) as ProductCreateRequest;
      const newProduct: ProductResponse = {
        id: nextProductId() as ProductResponse['id'],
        sku: body.sku,
        name: body.name,
        description: body.description ?? null,
        type: body.type,
        unit: body.unit,
        lifecycleStatus: 'Draft',
        metadata: {},
        externalMappings: [],
      };
      products = [newProduct, ...products];
      return created(newProduct);
    }),

    // PUT /catalog/products/{id}
    http.put(`${baseUrl}/products/:id`, async ({ params, request }) => {
      const body = (await request.json()) as ProductUpdateRequest;
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      if (product.lifecycleStatus !== 'Draft') {
        return HttpResponse.json(
          { title: 'Only Draft products can be updated.', status: 400 },
          { status: 400 }
        );
      }
      const updated: ProductResponse = {
        ...product,
        name: body.name,
        description: body.description,
        unit: body.unit,
      };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // PUT /catalog/products/{id}/metadata
    http.put(`${baseUrl}/products/:id/metadata`, async ({ params, request }) => {
      const body = (await request.json()) as UpdateProductMetadataRequest;
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const updated: ProductResponse = { ...product, metadata: body.metadata };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // POST /catalog/products/{id}/publish → 204 No Content
    http.post(`${baseUrl}/products/:id/publish`, ({ params }) => {
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const updated: ProductResponse = { ...product, lifecycleStatus: 'Published' };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return new HttpResponse(null, { status: 204 });
    }),

    // POST /catalog/products/{id}/archive → 204 No Content
    http.post(`${baseUrl}/products/:id/archive`, ({ params }) => {
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const updated: ProductResponse = { ...product, lifecycleStatus: 'Archived' };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return new HttpResponse(null, { status: 204 });
    }),

    // POST /catalog/products/{id}/external-mappings → 200 OK with the full product
    http.post(`${baseUrl}/products/:id/external-mappings`, async ({ params, request }) => {
      const body = (await request.json()) as AddProductExternalMappingRequest;
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const mapping = {
        id: nextMappingId() as ProductResponse['externalMappings'][number]['id'],
        providerName: body.providerName,
        externalId: body.externalId,
      };
      const updated: ProductResponse = {
        ...product,
        externalMappings: [...product.externalMappings, mapping],
      };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // DELETE /catalog/products/{id}/external-mappings/{mappingId}
    http.delete(`${baseUrl}/products/:id/external-mappings/:mappingId`, ({ params }) => {
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const updated: ProductResponse = {
        ...product,
        externalMappings: product.externalMappings.filter((m) => m.id !== params.mappingId),
      };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Reset the in-memory mock store. Useful between tests. */
export function resetCatalogMocks() {
  products = [...mockProducts];
  productCounter = 100;
  mappingCounter = 100;
}
