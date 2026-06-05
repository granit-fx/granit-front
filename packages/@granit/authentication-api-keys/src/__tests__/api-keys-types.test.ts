import { describe, expect, expectTypeOf, it } from 'vitest';

import { ApiKeyQuickFilters } from '../index';

import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyListItemResponse,
  ApiKeyResponse,
  ApiKeyRotateResponse,
  ApiKeyType,
  ApiKeyUpdateScopesRequest,
  CacheBehavior,
  ListApiKeysParams,
} from '../index';
import type { QueryRequest } from '@granit/query-engine';

describe('@granit/authentication-api-keys types', () => {
  describe('ApiKeyType', () => {
    it('should accept valid key types', () => {
      expectTypeOf<'Secret'>().toMatchTypeOf<ApiKeyType>();
      expectTypeOf<'Publishable'>().toMatchTypeOf<ApiKeyType>();
      expectTypeOf<'Webhook'>().toMatchTypeOf<ApiKeyType>();
      expectTypeOf<'Ephemeral'>().toMatchTypeOf<ApiKeyType>();
    });
  });

  describe('CacheBehavior', () => {
    it('should accept Normal and NoCache', () => {
      expectTypeOf<'Normal'>().toMatchTypeOf<CacheBehavior>();
      expectTypeOf<'NoCache'>().toMatchTypeOf<CacheBehavior>();
    });
  });

  describe('ApiKeyResponse', () => {
    it('should have identification fields', () => {
      expectTypeOf<ApiKeyResponse>().toHaveProperty('id');
      expectTypeOf<ApiKeyResponse['id']>().toBeString();
      expectTypeOf<ApiKeyResponse>().toHaveProperty('name');
      expectTypeOf<ApiKeyResponse>().toHaveProperty('type');
      expectTypeOf<ApiKeyResponse['type']>().toMatchTypeOf<ApiKeyType>();
    });

    it('should have security fields', () => {
      expectTypeOf<ApiKeyResponse>().toHaveProperty('prefix');
      expectTypeOf<ApiKeyResponse>().toHaveProperty('lastFourChars');
      expectTypeOf<ApiKeyResponse>().toHaveProperty('permissions');
      expectTypeOf<ApiKeyResponse>().toHaveProperty('allowedCidrs');
    });

    it('should have nullable timestamp fields', () => {
      expectTypeOf<ApiKeyResponse>().toHaveProperty('expiresAt');
      expectTypeOf<ApiKeyResponse>().toHaveProperty('lastUsedAt');
      expectTypeOf<ApiKeyResponse>().toHaveProperty('revokedAt');
    });
  });

  describe('ApiKeyListItemResponse', () => {
    it('should be a summary projection without permissions/allowedCidrs', () => {
      expectTypeOf<ApiKeyListItemResponse>().toHaveProperty('id');
      expectTypeOf<ApiKeyListItemResponse>().toHaveProperty('lastFourChars');
      expectTypeOf<ApiKeyListItemResponse>().toHaveProperty('cacheBehavior');
      expectTypeOf<ApiKeyListItemResponse>().not.toHaveProperty('permissions');
      expectTypeOf<ApiKeyListItemResponse>().not.toHaveProperty('allowedCidrs');
    });

    it('should keep nullable timestamp fields', () => {
      expectTypeOf<ApiKeyListItemResponse['expiresAt']>().toMatchTypeOf<string | null>();
      expectTypeOf<ApiKeyListItemResponse['revokedAt']>().toMatchTypeOf<string | null>();
    });
  });

  describe('ListApiKeysParams', () => {
    it('should be the generic QueryEngine request shape', () => {
      expectTypeOf<ListApiKeysParams>().toEqualTypeOf<QueryRequest>();
    });
  });

  describe('ApiKeyQuickFilters', () => {
    it('should expose the active/includeRevoked quick-filter names', () => {
      expect(ApiKeyQuickFilters.Active).toBe('active');
      expect(ApiKeyQuickFilters.IncludeRevoked).toBe('includeRevoked');
    });
  });

  describe('ApiKeyCreateRequest', () => {
    it('should require name, type, and environment', () => {
      expectTypeOf<ApiKeyCreateRequest>().toHaveProperty('name');
      expectTypeOf<ApiKeyCreateRequest>().toHaveProperty('type');
      expectTypeOf<ApiKeyCreateRequest>().toHaveProperty('environment');
    });
  });

  describe('ApiKeyCreateResponse', () => {
    it('should include the raw secret', () => {
      expectTypeOf<ApiKeyCreateResponse>().toHaveProperty('rawSecret');
      expectTypeOf<ApiKeyCreateResponse['rawSecret']>().toBeString();
    });
  });

  describe('ApiKeyRotateResponse', () => {
    it('should reference old and new key IDs', () => {
      expectTypeOf<ApiKeyRotateResponse>().toHaveProperty('newKeyId');
      expectTypeOf<ApiKeyRotateResponse>().toHaveProperty('oldKeyId');
      expectTypeOf<ApiKeyRotateResponse>().toHaveProperty('rawSecret');
    });
  });

  describe('ApiKeyUpdateScopesRequest', () => {
    it('should have permissions and allowedCidrs', () => {
      expectTypeOf<ApiKeyUpdateScopesRequest>().toHaveProperty('permissions');
      expectTypeOf<ApiKeyUpdateScopesRequest>().toHaveProperty('allowedCidrs');
    });
  });
});
