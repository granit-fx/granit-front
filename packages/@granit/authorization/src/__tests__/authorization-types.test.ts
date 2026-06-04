import { describe, expectTypeOf, it } from 'vitest';

import type {
  PermissionDefinitionResponse,
  PermissionGrantResponse,
  PermissionGrantParams,
  PermissionGroupResponse,
  MyPermissionsResponse,
} from '../index';

describe('@granit/authorization types', () => {
  describe('MyPermissionsResponse', () => {
    it('should have a permissions array', () => {
      expectTypeOf<MyPermissionsResponse>().toHaveProperty('permissions');
    });
  });

  describe('PermissionDefinitionResponse', () => {
    it('should have name and displayName', () => {
      expectTypeOf<PermissionDefinitionResponse>().toHaveProperty('name');
      expectTypeOf<PermissionDefinitionResponse['name']>().toBeString();
      expectTypeOf<PermissionDefinitionResponse>().toHaveProperty('displayName');
    });

    it('should carry a multi-tenancy side', () => {
      expectTypeOf<PermissionDefinitionResponse>().toHaveProperty('multiTenancySides');
      expectTypeOf<PermissionDefinitionResponse['multiTenancySides']>().toEqualTypeOf<
        'Host' | 'Tenant' | 'Both'
      >();
    });
  });

  describe('PermissionGroupResponse', () => {
    it('should have name and permissions array', () => {
      expectTypeOf<PermissionGroupResponse>().toHaveProperty('name');
      expectTypeOf<PermissionGroupResponse>().toHaveProperty('permissions');
    });
  });

  describe('PermissionGrantResponse', () => {
    it('should have roleName and permissions', () => {
      expectTypeOf<PermissionGrantResponse>().toHaveProperty('roleName');
      expectTypeOf<PermissionGrantResponse>().toHaveProperty('permissions');
    });
  });

  describe('PermissionGrantParams', () => {
    it('should have roleName and permissionName', () => {
      expectTypeOf<PermissionGrantParams>().toHaveProperty('roleName');
      expectTypeOf<PermissionGrantParams['roleName']>().toBeString();
      expectTypeOf<PermissionGrantParams>().toHaveProperty('permissionName');
      expectTypeOf<PermissionGrantParams['permissionName']>().toBeString();
    });
  });
});
