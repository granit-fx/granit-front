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
    it('should not carry a client — it is resolved from the provider', () => {
      expectTypeOf<UsePermissionsOptions>().not.toHaveProperty('client');
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
    it('should not carry a client', () => {
      expectTypeOf<UsePermissionDefinitionsOptions>().not.toHaveProperty('client');
    });
  });

  describe('UseRolePermissionsOptions', () => {
    it('should require roleName and not carry a client', () => {
      expectTypeOf<UseRolePermissionsOptions>().toHaveProperty('roleName');
      expectTypeOf<UseRolePermissionsOptions>().not.toHaveProperty('client');
    });
  });

  describe('UsePermissionGrantOptions', () => {
    it('should not carry a client', () => {
      expectTypeOf<UsePermissionGrantOptions>().not.toHaveProperty('client');
    });
  });
});
