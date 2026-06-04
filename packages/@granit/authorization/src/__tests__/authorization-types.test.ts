import { describe, expectTypeOf, it } from 'vitest';

import type {
  PermissionDefinitionDto,
  PermissionGrantDto,
  PermissionGrantParams,
  PermissionGroupDto,
  PermissionsResponse,
} from '../index';

describe('@granit/authorization types', () => {
  describe('PermissionsResponse', () => {
    it('should have a permissions array', () => {
      expectTypeOf<PermissionsResponse>().toHaveProperty('permissions');
    });
  });

  describe('PermissionDefinitionDto', () => {
    it('should have name and displayName', () => {
      expectTypeOf<PermissionDefinitionDto>().toHaveProperty('name');
      expectTypeOf<PermissionDefinitionDto['name']>().toBeString();
      expectTypeOf<PermissionDefinitionDto>().toHaveProperty('displayName');
    });

    it('should carry a multi-tenancy side', () => {
      expectTypeOf<PermissionDefinitionDto>().toHaveProperty('multiTenancySide');
      expectTypeOf<PermissionDefinitionDto['multiTenancySide']>().toEqualTypeOf<
        'Host' | 'Tenant' | 'Both'
      >();
    });
  });

  describe('PermissionGroupDto', () => {
    it('should have name and permissions array', () => {
      expectTypeOf<PermissionGroupDto>().toHaveProperty('name');
      expectTypeOf<PermissionGroupDto>().toHaveProperty('permissions');
    });
  });

  describe('PermissionGrantDto', () => {
    it('should have roleName and permissions', () => {
      expectTypeOf<PermissionGrantDto>().toHaveProperty('roleName');
      expectTypeOf<PermissionGrantDto>().toHaveProperty('permissions');
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
