import { describe, expectTypeOf, it } from 'vitest';

import type { EntraIdAuthContextType, EntraIdCoreConfig } from '../index';

describe('@granit/authentication-entraid types', () => {
  describe('EntraIdAuthContextType', () => {
    it('should extend BaseAuthContextType with msalInstance field', () => {
      expectTypeOf<EntraIdAuthContextType>().toHaveProperty('msalInstance');
      expectTypeOf<EntraIdAuthContextType>().toHaveProperty('authenticated');
      expectTypeOf<EntraIdAuthContextType>().toHaveProperty('loading');
      expectTypeOf<EntraIdAuthContextType>().toHaveProperty('user');
      expectTypeOf<EntraIdAuthContextType>().toHaveProperty('login');
      expectTypeOf<EntraIdAuthContextType>().toHaveProperty('logout');
    });
  });

  describe('EntraIdCoreConfig', () => {
    it('should require clientId, authority, and redirectUri', () => {
      expectTypeOf<EntraIdCoreConfig>().toHaveProperty('clientId');
      expectTypeOf<EntraIdCoreConfig['clientId']>().toBeString();
      expectTypeOf<EntraIdCoreConfig>().toHaveProperty('authority');
      expectTypeOf<EntraIdCoreConfig['authority']>().toBeString();
      expectTypeOf<EntraIdCoreConfig>().toHaveProperty('redirectUri');
      expectTypeOf<EntraIdCoreConfig['redirectUri']>().toBeString();
    });

    it('should have optional scopes and callbacks', () => {
      expectTypeOf<EntraIdCoreConfig>().toHaveProperty('scopes');
      expectTypeOf<EntraIdCoreConfig>().toHaveProperty('onAcquireTokenFailure');
      expectTypeOf<EntraIdCoreConfig>().toHaveProperty('onSessionEnd');
    });
  });
});
