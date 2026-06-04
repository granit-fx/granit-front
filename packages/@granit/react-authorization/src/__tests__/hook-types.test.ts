import { describe, expectTypeOf, it } from 'vitest';

import type {
  UsePermissionDefinitionsOptions,
  UsePermissionGrantOptions,
  UsePermissionsOptions,
  UsePermissionsReturn,
  UseRolePermissionsOptions,
} from '../index';

describe('@granit/react-authorization hook types', () => {
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

  describe('UsePermissionDefinitionsOptions', () => {
    it('should require client', () => {
      expectTypeOf<UsePermissionDefinitionsOptions>().toHaveProperty('client');
    });
  });

  describe('UseRolePermissionsOptions', () => {
    it('should require client and roleName', () => {
      expectTypeOf<UseRolePermissionsOptions>().toHaveProperty('client');
      expectTypeOf<UseRolePermissionsOptions>().toHaveProperty('roleName');
    });
  });

  describe('UsePermissionGrantOptions', () => {
    it('should require client', () => {
      expectTypeOf<UsePermissionGrantOptions>().toHaveProperty('client');
    });
  });
});
