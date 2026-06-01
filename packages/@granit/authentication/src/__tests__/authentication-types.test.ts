import { describe, expectTypeOf, it } from 'vitest';

import type { BaseAuthContextType, LoginOptions, LogoutOptions, OidcUserInfo } from '../index';

describe('@granit/authentication types', () => {
  describe('OidcUserInfo', () => {
    it('should require sub field', () => {
      expectTypeOf<OidcUserInfo>().toHaveProperty('sub');
      expectTypeOf<OidcUserInfo['sub']>().toBeString();
    });

    it('should have optional profile fields', () => {
      expectTypeOf<OidcUserInfo>().toHaveProperty('email');
      expectTypeOf<OidcUserInfo>().toHaveProperty('name');
      expectTypeOf<OidcUserInfo>().toHaveProperty('preferred_username');
      expectTypeOf<OidcUserInfo>().toHaveProperty('given_name');
      expectTypeOf<OidcUserInfo>().toHaveProperty('family_name');
    });
  });

  describe('LoginOptions', () => {
    it('should have optional redirectUri and idpHint', () => {
      expectTypeOf<LoginOptions>().toHaveProperty('redirectUri');
      expectTypeOf<LoginOptions>().toHaveProperty('idpHint');
      expectTypeOf<LoginOptions>().toHaveProperty('prompt');
    });
  });

  describe('LogoutOptions', () => {
    it('should have optional redirectUri', () => {
      expectTypeOf<LogoutOptions>().toHaveProperty('redirectUri');
    });
  });

  describe('BaseAuthContextType', () => {
    it('should have authentication state fields', () => {
      expectTypeOf<BaseAuthContextType>().toHaveProperty('authenticated');
      expectTypeOf<BaseAuthContextType['authenticated']>().toBeBoolean();
      expectTypeOf<BaseAuthContextType>().toHaveProperty('loading');
      expectTypeOf<BaseAuthContextType['loading']>().toBeBoolean();
    });

    it('should have user field', () => {
      expectTypeOf<BaseAuthContextType>().toHaveProperty('user');
    });

    it('should have login and logout methods', () => {
      expectTypeOf<BaseAuthContextType>().toHaveProperty('login');
      expectTypeOf<BaseAuthContextType>().toHaveProperty('logout');
      expectTypeOf<BaseAuthContextType['login']>().toBeFunction();
      expectTypeOf<BaseAuthContextType['logout']>().toBeFunction();
    });

    it('should NOT have keycloak field (provider-agnostic)', () => {
      expectTypeOf<BaseAuthContextType>().not.toHaveProperty('keycloak');
    });
  });
});
