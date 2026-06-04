import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  addProductExternalMapping,
  archiveProduct,
  createProduct,
  getProductById,
  getProductBySku,
  listPublishedProducts,
  publishProduct,
  removeProductExternalMapping,
  updateProduct,
  updateProductMetadata,
} from '../api/products-api';

import type {
  AddProductExternalMappingRequest,
  ProductCreateRequest,
  ProductExternalMappingId,
  ProductExternalMappingResponse,
  ProductId,
  ProductResponse,
  ProductUpdateRequest,
  UpdateProductMetadataRequest,
} from '../types/index';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const PRODUCT_ID = 'prod-550e8400-e29b-41d4-a716-446655440001' as ProductId;
const PRODUCT_ID_2 = 'prod-550e8400-e29b-41d4-a716-446655440002' as ProductId;
const MAPPING_ID = 'map-550e8400-e29b-41d4-a716-446655440099' as ProductExternalMappingId;

const sampleMapping: ProductExternalMappingResponse = {
  id: MAPPING_ID,
  providerName: 'Stripe',
  externalId: 'price_1OqXYZ123abc',
};

const sampleProduct: ProductResponse = {
  id: PRODUCT_ID,
  sku: 'SVC-CONSULT-1H',
  name: 'Consulting — 1 hour',
  description: 'One hour of senior consulting services.',
  type: 'Service',
  unit: 'hour',
  lifecycleStatus: 'Published',
  metadata: { category: 'professional-services', taxCode: 'SVR-CONSULT' },
  externalMappings: [sampleMapping],
};

const sampleDraftProduct: ProductResponse = {
  id: PRODUCT_ID_2,
  sku: 'GOOD-WIDGET-A',
  name: 'Widget A',
  description: null,
  type: 'Good',
  unit: 'each',
  lifecycleStatus: 'Draft',
  metadata: {},
  externalMappings: [],
};

const basePath = '/api/catalog';

// ---------------------------------------------------------------------------
// listPublishedProducts
// ---------------------------------------------------------------------------

describe('listPublishedProducts', () => {
  it('should GET {basePath}/products', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

    const result = await listPublishedProducts(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/products`);
    expect(result).toEqual([sampleProduct]);
  });

  it('should return an empty array when no products are published', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const result = await listPublishedProducts(client, basePath);

    expect(result).toEqual([]);
  });

  it('should work with a custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleProduct] });

    await listPublishedProducts(client, '/v2/shop');

    expect(client.get).toHaveBeenCalledWith('/v2/shop/products');
  });
});

// ---------------------------------------------------------------------------
// getProductById
// ---------------------------------------------------------------------------

describe('getProductById', () => {
  it('should GET {basePath}/products/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

    const result = await getProductById(client, basePath, PRODUCT_ID);

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}`
    );
    expect(result).toEqual(sampleProduct);
  });

  it('should URI-encode IDs that contain special characters', async () => {
    const client = createMockClient();
    const specialId = 'prod/with spaces&chars' as ProductId;
    vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

    await getProductById(client, basePath, specialId);

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(specialId)}`
    );
  });

  it('should return the product with null description', async () => {
    const client = createMockClient();
    const product: ProductResponse = { ...sampleDraftProduct };
    vi.mocked(client.get).mockResolvedValue({ data: product });

    const result = await getProductById(client, basePath, sampleDraftProduct.id);

    expect(result.description).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getProductBySku
// ---------------------------------------------------------------------------

describe('getProductBySku', () => {
  it('should GET {basePath}/products/by-sku/{sku}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

    const result = await getProductBySku(client, basePath, 'SVC-CONSULT-1H');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/products/by-sku/${encodeURIComponent('SVC-CONSULT-1H')}`
    );
    expect(result).toEqual(sampleProduct);
  });

  it('should URI-encode SKUs that contain special characters', async () => {
    const client = createMockClient();
    const specialSku = 'SKU/A B+1';
    vi.mocked(client.get).mockResolvedValue({ data: sampleProduct });

    await getProductBySku(client, basePath, specialSku);

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/products/by-sku/${encodeURIComponent(specialSku)}`
    );
  });
});

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

describe('createProduct', () => {
  it('should POST {basePath}/products with the request body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleDraftProduct });

    const request: ProductCreateRequest = {
      sku: 'GOOD-WIDGET-A',
      name: 'Widget A',
      type: 'Good',
      unit: 'each',
    };

    const result = await createProduct(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/products`, request);
    expect(result).toEqual(sampleDraftProduct);
    expect(result.lifecycleStatus).toBe('Draft');
  });

  it('should accept an optional description', async () => {
    const client = createMockClient();
    const productWithDesc: ProductResponse = {
      ...sampleDraftProduct,
      description: 'A sturdy widget.',
    };
    vi.mocked(client.post).mockResolvedValue({ data: productWithDesc });

    const request: ProductCreateRequest = {
      sku: 'GOOD-WIDGET-A',
      name: 'Widget A',
      type: 'Good',
      unit: 'each',
      description: 'A sturdy widget.',
    };

    const result = await createProduct(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/products`, request);
    expect(result.description).toBe('A sturdy widget.');
  });
});

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

describe('updateProduct', () => {
  it('should PUT {basePath}/products/{id} with the request body', async () => {
    const client = createMockClient();
    const updated: ProductResponse = {
      ...sampleDraftProduct,
      name: 'Widget A (revised)',
      description: 'Updated description.',
      unit: 'box',
    };
    vi.mocked(client.put).mockResolvedValue({ data: updated });

    const request: ProductUpdateRequest = {
      name: 'Widget A (revised)',
      description: 'Updated description.',
      unit: 'box',
    };

    const result = await updateProduct(client, basePath, PRODUCT_ID_2, request);

    expect(client.put).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID_2)}`,
      request
    );
    expect(result.name).toBe('Widget A (revised)');
  });

  it('should accept null description in update request', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({ data: sampleDraftProduct });

    const request: ProductUpdateRequest = {
      name: 'Widget A',
      description: null,
      unit: 'each',
    };

    await updateProduct(client, basePath, PRODUCT_ID_2, request);

    expect(client.put).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID_2)}`,
      request
    );
  });
});

// ---------------------------------------------------------------------------
// updateProductMetadata
// ---------------------------------------------------------------------------

describe('updateProductMetadata', () => {
  it('should PUT {basePath}/products/{id}/metadata with the request body', async () => {
    const client = createMockClient();
    const updatedProduct: ProductResponse = {
      ...sampleProduct,
      metadata: { category: 'consulting', region: 'EU' },
    };
    vi.mocked(client.put).mockResolvedValue({ data: updatedProduct });

    const request: UpdateProductMetadataRequest = {
      metadata: { category: 'consulting', region: 'EU' },
    };

    const result = await updateProductMetadata(client, basePath, PRODUCT_ID, request);

    expect(client.put).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}/metadata`,
      request
    );
    expect(result.metadata).toEqual({ category: 'consulting', region: 'EU' });
  });

  it('should accept an empty metadata object (clears all metadata)', async () => {
    const client = createMockClient();
    const cleared: ProductResponse = { ...sampleProduct, metadata: {} };
    vi.mocked(client.put).mockResolvedValue({ data: cleared });

    const request: UpdateProductMetadataRequest = { metadata: {} };

    const result = await updateProductMetadata(client, basePath, PRODUCT_ID, request);

    expect(client.put).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}/metadata`,
      request
    );
    expect(result.metadata).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// publishProduct
// ---------------------------------------------------------------------------

describe('publishProduct', () => {
  it('should POST {basePath}/products/{id}/publish', async () => {
    const client = createMockClient();
    const publishedProduct: ProductResponse = {
      ...sampleDraftProduct,
      lifecycleStatus: 'Published',
    };
    vi.mocked(client.post).mockResolvedValue({ data: publishedProduct });

    const result = await publishProduct(client, basePath, PRODUCT_ID_2);

    expect(client.post).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID_2)}/publish`
    );
    expect(result.lifecycleStatus).toBe('Published');
  });

  it('should URI-encode the product ID', async () => {
    const client = createMockClient();
    const specialId = 'prod/special id' as ProductId;
    vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

    await publishProduct(client, basePath, specialId);

    expect(client.post).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(specialId)}/publish`
    );
  });
});

// ---------------------------------------------------------------------------
// archiveProduct
// ---------------------------------------------------------------------------

describe('archiveProduct', () => {
  it('should POST {basePath}/products/{id}/archive', async () => {
    const client = createMockClient();
    const archivedProduct: ProductResponse = {
      ...sampleProduct,
      lifecycleStatus: 'Archived',
    };
    vi.mocked(client.post).mockResolvedValue({ data: archivedProduct });

    const result = await archiveProduct(client, basePath, PRODUCT_ID);

    expect(client.post).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}/archive`
    );
    expect(result.lifecycleStatus).toBe('Archived');
  });

  it('should URI-encode the product ID', async () => {
    const client = createMockClient();
    const specialId = 'prod/archive&me' as ProductId;
    vi.mocked(client.post).mockResolvedValue({ data: sampleProduct });

    await archiveProduct(client, basePath, specialId);

    expect(client.post).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(specialId)}/archive`
    );
  });
});

// ---------------------------------------------------------------------------
// addProductExternalMapping
// ---------------------------------------------------------------------------

describe('addProductExternalMapping', () => {
  it('should POST {basePath}/products/{id}/external-mappings with the request body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: sampleMapping });

    const request: AddProductExternalMappingRequest = {
      providerName: 'Stripe',
      externalId: 'price_1OqXYZ123abc',
    };

    const result = await addProductExternalMapping(client, basePath, PRODUCT_ID, request);

    expect(client.post).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}/external-mappings`,
      request
    );
    expect(result).toEqual(sampleMapping);
  });

  it('should support other provider names (Avalara, Odoo)', async () => {
    const client = createMockClient();
    const avalaraMapping: ProductExternalMappingResponse = {
      id: 'map-avalara-001' as ProductExternalMappingId,
      providerName: 'Avalara',
      externalId: 'AVA-SERVICE-001',
    };
    vi.mocked(client.post).mockResolvedValue({ data: avalaraMapping });

    const request: AddProductExternalMappingRequest = {
      providerName: 'Avalara',
      externalId: 'AVA-SERVICE-001',
    };

    const result = await addProductExternalMapping(client, basePath, PRODUCT_ID, request);

    expect(client.post).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}/external-mappings`,
      request
    );
    expect(result.providerName).toBe('Avalara');
  });
});

// ---------------------------------------------------------------------------
// removeProductExternalMapping
// ---------------------------------------------------------------------------

describe('removeProductExternalMapping', () => {
  it('should DELETE {basePath}/products/{id}/external-mappings/{mappingId}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    await removeProductExternalMapping(client, basePath, PRODUCT_ID, MAPPING_ID);

    expect(client.delete).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(PRODUCT_ID)}/external-mappings/${encodeURIComponent(MAPPING_ID)}`
    );
  });

  it('should URI-encode both the product ID and the mapping ID', async () => {
    const client = createMockClient();
    const specialProductId = 'prod/p 1' as ProductId;
    const specialMappingId = 'map/m 2' as ProductExternalMappingId;
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    await removeProductExternalMapping(client, basePath, specialProductId, specialMappingId);

    expect(client.delete).toHaveBeenCalledWith(
      `${basePath}/products/${encodeURIComponent(specialProductId)}/external-mappings/${encodeURIComponent(specialMappingId)}`
    );
  });

  it('should resolve to undefined (void return)', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    const result = await removeProductExternalMapping(client, basePath, PRODUCT_ID, MAPPING_ID);

    expect(result).toBeUndefined();
  });
});
