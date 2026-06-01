import { describe, expectTypeOf, it } from 'vitest';

import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyResponse,
  ApiKeyRotateResponse,
  ApiKeyType,
  ApiKeyUpdateScopesRequest,
  CacheBehavior,
} from '../index';

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
