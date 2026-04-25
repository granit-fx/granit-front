import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  addProductExternalMapping,
  archiveProduct,
  createProduct,
  getProductById,
  getProductBySku,
  listProducts,
  listPublishedProducts,
  publishProduct,
  removeProductExternalMapping,
  updateProduct,
  updateProductMetadata,
} from '../api/catalog-api.js';

import type {
  AddProductExternalMappingRequest,
  Product,
  ProductCreateRequest,
  ProductExternalMappingResponse,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '../types.js';
import type { PagedResult } from '@granit/query-engine';

const basePath = '/api/granit/catalog';

const sampleProduct: ProductResponse = {
  id: toEntityId<'Product'>('prd-1'),
  sku: 'API-CALLS',
  name: 'API Calls',
  description: 'Per-call billing for the public API.',
  type: 'Metered',
  unit: 'call',
  lifecycleStatus: 'Published',
  metadata: { tier: 'standard' },
  externalMappings: [
    {
      id: toEntityId<'ProductExternalMapping'>('pem-1'),
      providerName: 'Stripe',
      externalId: 'prod_AbC123',
    },
  ],
};

describe('catalog-api', () => {
  describe('listPublishedProducts', () => {
    it('should GET {basePath}/products', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

      const result = await listPublishedProducts(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/catalog/products');
      expect(result).toEqual([sampleProduct]);
    });
  });

  describe('getProductById', () => {
    it('should GET {basePath}/products/{id} and encode the id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

      await getProductById(client, basePath, 'prd id/with spaces');

      expect(client.get).toHaveBeenCalledWith(
        '/api/granit/catalog/products/prd%20id%2Fwith%20spaces'
      );
    });
  });

  describe('getProductBySku', () => {
    it('should GET {basePath}/products/by-sku/{sku} and encode the sku', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

      await getProductBySku(client, basePath, 'API/CALLS PRO');

      expect(client.get).toHaveBeenCalledWith(
        '/api/granit/catalog/products/by-sku/API%2FCALLS%20PRO'
      );
    });
  });

  describe('createProduct', () => {
    it('should POST {basePath}/products', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

      const request: ProductCreateRequest = {
        sku: 'API-CALLS',
        name: 'API Calls',
        type: 'Metered',
        unit: 'call',
        description: 'Per-call billing for the public API.',
      };

      await createProduct(client, basePath, request);

      expect(client.post).toHaveBeenCalledWith('/api/granit/catalog/products', request);
    });
  });

  describe('updateProduct', () => {
    it('should PUT {basePath}/products/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleProduct });

      const request: ProductUpdateRequest = {
        name: 'API Calls v2',
        description: null,
        unit: 'call',
      };

      await updateProduct(client, basePath, 'prd-1', request);

      expect(client.put).toHaveBeenCalledWith('/api/granit/catalog/products/prd-1', request);
    });
  });

  describe('updateProductMetadata', () => {
    it('should PUT {basePath}/products/{id}/metadata', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: sampleProduct });

      const request: UpdateProductMetadataRequest = {
        metadata: { tier: 'premium', region: 'eu' },
      };

      await updateProductMetadata(client, basePath, 'prd-1', request);

      expect(client.put).toHaveBeenCalledWith(
        '/api/granit/catalog/products/prd-1/metadata',
        request
      );
    });
  });

  describe('publishProduct', () => {
    it('should POST {basePath}/products/{id}/publish', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

      await publishProduct(client, basePath, 'prd-1');

      expect(client.post).toHaveBeenCalledWith('/api/granit/catalog/products/prd-1/publish');
    });
  });

  describe('archiveProduct', () => {
    it('should POST {basePath}/products/{id}/archive', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

      await archiveProduct(client, basePath, 'prd-1');

      expect(client.post).toHaveBeenCalledWith('/api/granit/catalog/products/prd-1/archive');
    });
  });

  describe('addProductExternalMapping', () => {
    it('should POST {basePath}/products/{id}/external-mappings', async () => {
      const client = createMockClient();
      const mapping: ProductExternalMappingResponse = {
        id: toEntityId<'ProductExternalMapping'>('pem-1'),
        providerName: 'Stripe',
        externalId: 'prod_AbC123',
      };
      vi.mocked(client.post).mockResolvedValue({ data: mapping });

      const request: AddProductExternalMappingRequest = {
        providerName: 'Stripe',
        externalId: 'prod_AbC123',
      };

      const result = await addProductExternalMapping(client, basePath, 'prd-1', request);

      expect(client.post).toHaveBeenCalledWith(
        '/api/granit/catalog/products/prd-1/external-mappings',
        request
      );
      expect(result).toEqual(mapping);
    });
  });

  describe('removeProductExternalMapping', () => {
    it('should DELETE {basePath}/products/{id}/external-mappings/{mappingId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await removeProductExternalMapping(client, basePath, 'prd-1', 'pem-1');

      expect(client.delete).toHaveBeenCalledWith(
        '/api/granit/catalog/products/prd-1/external-mappings/pem-1'
      );
    });
  });

  describe('listProducts (QueryEngine)', () => {
    it('should GET {basePath}/product-records with query string parameters', async () => {
      const client = createMockClient();
      const product: Product = {
        id: toEntityId<'Product'>('prd-1'),
        tenantId: null,
        sku: 'API-CALLS',
        name: 'API Calls',
        description: null,
        type: 'Metered',
        unit: 'call',
        lifecycleStatus: 'Published',
        createdAt: toISODateString('2026-04-01T00:00:00Z'),
        modifiedAt: toISODateString('2026-04-01T00:00:00Z'),
      };
      const page: PagedResult<Product> = {
        items: [product],
        totalCount: 1,
      };
      vi.mocked(client.get).mockResolvedValue({ data: page });

      const result = await listProducts(client, basePath, { page: 1, pageSize: 25 });

      expect(client.get).toHaveBeenCalledTimes(1);
      const url = vi.mocked(client.get).mock.calls[0]?.[0] as string;
      expect(url).toContain('/api/granit/catalog/product-records');
      expect(url).toContain('page=1');
      expect(url).toContain('pageSize=25');
      expect(result).toEqual(page);
    });

    it('should GET {basePath}/product-records without parameters when omitted', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({
        data: { items: [], totalCount: 0 },
      });

      await listProducts(client, basePath);

      expect(client.get).toHaveBeenCalledWith('/api/granit/catalog/product-records');
    });
  });
});
