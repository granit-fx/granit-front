import { noContent, notFound } from '@granit/testing/msw';
import { toEntityId } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { sampleProducts } from './data.js';

import type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductExternalMappingResponse,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '@granit/catalog';

/**
 * Create stateful MSW handlers for catalog endpoints.
 * Product mutations (create / update / publish / archive / metadata / external-mappings)
 * persist in the in-memory list.
 *
 * @param baseUrl - API base path (default: `/api/v1/catalog`)
 */
export function createCatalogHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let products = [...sampleProducts];

  return [
    // GET list published products
    http.get(`${baseUrl}/products`, () => {
      return HttpResponse.json(products.filter((p) => p.lifecycleStatus === 'Published'));
    }),

    // GET product by id
    http.get(`${baseUrl}/products/:id`, ({ params }) => {
      const product = products.find((p) => p.id === params.id);
      if (!product) return notFound();
      return HttpResponse.json(product);
    }),

    // GET product by SKU
    http.get(`${baseUrl}/products/by-sku/:sku`, ({ params }) => {
      const product = products.find((p) => p.sku === params.sku);
      if (!product) return notFound();
      return HttpResponse.json(product);
    }),

    // POST create product
    http.post(`${baseUrl}/products`, async ({ request }) => {
      const body = (await request.json()) as ProductCreateRequest;
      const newProduct: ProductResponse = {
        id: toEntityId<'Product'>(`prd_${String(products.length + 1).padStart(3, '0')}`),
        sku: body.sku,
        name: body.name,
        description: body.description ?? null,
        type: body.type,
        unit: body.unit,
        lifecycleStatus: 'Draft',
        metadata: {},
        externalMappings: [],
      };
      products = [...products, newProduct];
      return HttpResponse.json(newProduct, { status: 201 });
    }),

    // PUT update product
    http.put(`${baseUrl}/products/:id`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as ProductUpdateRequest;
      const existing = products.find((p) => p.id === id);
      if (!existing) return notFound();

      const updated: ProductResponse = {
        ...existing,
        name: body.name,
        description: body.description,
        unit: body.unit,
      };
      products = products.map((p) => (p.id === id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // PUT product metadata
    http.put(`${baseUrl}/products/:id/metadata`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as UpdateProductMetadataRequest;
      const existing = products.find((p) => p.id === id);
      if (!existing) return notFound();

      const updated: ProductResponse = { ...existing, metadata: body.metadata };
      products = products.map((p) => (p.id === id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // POST publish
    http.post(`${baseUrl}/products/:id/publish`, ({ params }) => {
      const id = params.id as string;
      const existing = products.find((p) => p.id === id);
      if (!existing) return notFound();

      const updated: ProductResponse = { ...existing, lifecycleStatus: 'Published' };
      products = products.map((p) => (p.id === id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // POST archive
    http.post(`${baseUrl}/products/:id/archive`, ({ params }) => {
      const id = params.id as string;
      const existing = products.find((p) => p.id === id);
      if (!existing) return notFound();

      const updated: ProductResponse = { ...existing, lifecycleStatus: 'Archived' };
      products = products.map((p) => (p.id === id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // POST external mapping
    http.post(`${baseUrl}/products/:id/external-mappings`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as AddProductExternalMappingRequest;
      const existing = products.find((p) => p.id === id);
      if (!existing) return notFound();

      const mapping: ProductExternalMappingResponse = {
        id: toEntityId<'ProductExternalMapping'>(
          `pem_${String(existing.externalMappings.length + 1).padStart(3, '0')}`
        ),
        providerName: body.providerName,
        externalId: body.externalId,
      };
      const updated: ProductResponse = {
        ...existing,
        externalMappings: [...existing.externalMappings, mapping],
      };
      products = products.map((p) => (p.id === id ? updated : p));
      return HttpResponse.json(mapping, { status: 201 });
    }),

    // DELETE external mapping
    http.delete(`${baseUrl}/products/:id/external-mappings/:mappingId`, ({ params }) => {
      const id = params.id as string;
      const mappingId = params.mappingId as string;
      const existing = products.find((p) => p.id === id);
      if (!existing) return notFound();

      const updated: ProductResponse = {
        ...existing,
        externalMappings: existing.externalMappings.filter((m) => m.id !== mappingId),
      };
      products = products.map((p) => (p.id === id ? updated : p));
      return noContent();
    }),
  ];
}
