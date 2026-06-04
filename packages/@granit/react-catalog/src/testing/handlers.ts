import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockProducts } from './data';

import type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '@granit/catalog';

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

/**
 * Create stateful MSW handlers for catalog product endpoints.
 * Handlers mutate an in-memory store — mutations are reflected by subsequent GETs.
 * Call {@link resetCatalogMocks} between tests to restore the initial fixtures.
 *
 * @param baseUrl - API base path (default: `/api/v1/catalog`)
 */
export function createCatalogHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /catalog/products → Published only
    http.get(`${baseUrl}/products`, () => {
      const published = products.filter((p) => p.lifecycleStatus === 'Published');
      return HttpResponse.json(published);
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
      const created: ProductResponse = {
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
      products = [created, ...products];
      return HttpResponse.json(created, { status: 201 });
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

    // POST /catalog/products/{id}/publish
    http.post(`${baseUrl}/products/:id/publish`, ({ params }) => {
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const updated: ProductResponse = { ...product, lifecycleStatus: 'Published' };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // POST /catalog/products/{id}/archive
    http.post(`${baseUrl}/products/:id/archive`, ({ params }) => {
      const product = findProductOrFail(params.id as string);
      if (!product) return new HttpResponse(null, { status: 404 });
      const updated: ProductResponse = { ...product, lifecycleStatus: 'Archived' };
      products = products.map((p) => (p.id === updated.id ? updated : p));
      return HttpResponse.json(updated);
    }),

    // POST /catalog/products/{id}/external-mappings
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
      return HttpResponse.json(mapping, { status: 201 });
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
