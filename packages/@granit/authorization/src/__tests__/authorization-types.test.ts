import { describe, expectTypeOf, it } from 'vitest';

import type {
  PermissionDefinitionDto,
  PermissionGrantDto,
  PermissionGrantParams,
  PermissionGroupDto,
  PermissionsResponse,
  UsePermissionDefinitionsOptions,
  UsePermissionGrantOptions,
  UsePermissionsOptions,
  UsePermissionsReturn,
  UseRolePermissionsOptions,
} from '../index';

describe('@granit/authorization types', () => {
  describe('PermissionsResponse', () => {
    it('should have a permissions array', () => {
      expectTypeOf<PermissionsResponse>().toHaveProperty('permissions');
    });
  });

  describe('UsePermissionsOptions', () => {
    it('should require a client', () => {
      expectTypeOf<UsePermissionsOptions>().toHaveProperty('client');
    });

    it('should have optional basePath and enabled', () => {
      expectTypeOf<UsePermissionsOptions>().toHaveProperty('basePath');
      expectTypeOf<UsePermissionsOptions>().toHaveProperty('enabled');
    });
  });

  describe('UsePermissionsReturn', () => {
    it('should expose permission check methods', () => {
      expectTypeOf<UsePermissionsReturn>().toHaveProperty('hasPermission');
      expectTypeOf<UsePermissionsReturn['hasPermission']>().toBeFunction();
      expectTypeOf<UsePermissionsReturn>().toHaveProperty('hasAnyPermission');
      expectTypeOf<UsePermissionsReturn>().toHaveProperty('hasAllPermissions');
    });

    it('should expose loading and error state', () => {
      expectTypeOf<UsePermissionsReturn>().toHaveProperty('isLoading');
      expectTypeOf<UsePermissionsReturn['isLoading']>().toBeBoolean();
      expectTypeOf<UsePermissionsReturn>().toHaveProperty('error');
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

  describe('Hook options types', () => {
    it('UsePermissionDefinitionsOptions should require client', () => {
      expectTypeOf<UsePermissionDefinitionsOptions>().toHaveProperty('client');
    });

    it('UseRolePermissionsOptions should require client and roleName', () => {
      expectTypeOf<UseRolePermissionsOptions>().toHaveProperty('client');
      expectTypeOf<UseRolePermissionsOptions>().toHaveProperty('roleName');
    });

    it('UsePermissionGrantOptions should require client', () => {
      expectTypeOf<UsePermissionGrantOptions>().toHaveProperty('client');
    });
  });
});
