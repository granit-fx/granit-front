import { describe, expectTypeOf, it } from 'vitest';

import type {
  KeycloakAuthContextType,
  KeycloakCoreConfig,
  KeycloakEvent,
  KeycloakUserInfo,
} from '../index';

describe('@granit/authentication-keycloak types', () => {
  describe('KeycloakUserInfo', () => {
    it('should require sub field', () => {
      expectTypeOf<KeycloakUserInfo>().toHaveProperty('sub');
      expectTypeOf<KeycloakUserInfo['sub']>().toBeString();
    });

    it('should have optional profile fields', () => {
      expectTypeOf<KeycloakUserInfo>().toHaveProperty('email');
      expectTypeOf<KeycloakUserInfo>().toHaveProperty('name');
      expectTypeOf<KeycloakUserInfo>().toHaveProperty('preferred_username');
      expectTypeOf<KeycloakUserInfo>().toHaveProperty('given_name');
      expectTypeOf<KeycloakUserInfo>().toHaveProperty('family_name');
    });
  });

  describe('KeycloakEvent', () => {
    it('should accept valid event names', () => {
      expectTypeOf<'onReady'>().toMatchTypeOf<KeycloakEvent>();
      expectTypeOf<'onAuthSuccess'>().toMatchTypeOf<KeycloakEvent>();
      expectTypeOf<'onAuthError'>().toMatchTypeOf<KeycloakEvent>();
      expectTypeOf<'onTokenExpired'>().toMatchTypeOf<KeycloakEvent>();
    });
  });

  describe('KeycloakAuthContextType', () => {
    it('should extend BaseAuthContextType with keycloak field', () => {
      expectTypeOf<KeycloakAuthContextType>().toHaveProperty('keycloak');
      expectTypeOf<KeycloakAuthContextType>().toHaveProperty('authenticated');
      expectTypeOf<KeycloakAuthContextType>().toHaveProperty('loading');
      expectTypeOf<KeycloakAuthContextType>().toHaveProperty('user');
      expectTypeOf<KeycloakAuthContextType>().toHaveProperty('login');
      expectTypeOf<KeycloakAuthContextType>().toHaveProperty('logout');
    });
  });

  describe('KeycloakCoreConfig', () => {
    it('should require url, realm, and clientId', () => {
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('url');
      expectTypeOf<KeycloakCoreConfig['url']>().toBeString();
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('realm');
      expectTypeOf<KeycloakCoreConfig['realm']>().toBeString();
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('clientId');
      expectTypeOf<KeycloakCoreConfig['clientId']>().toBeString();
    });

    it('should have optional lifecycle callbacks', () => {
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('onTokenExpired');
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('onAuthRefreshError');
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('onAuthLogout');
      expectTypeOf<KeycloakCoreConfig>().toHaveProperty('onEvent');
    });
  });
});
