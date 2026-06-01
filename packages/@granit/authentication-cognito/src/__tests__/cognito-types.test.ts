import { describe, expectTypeOf, it } from 'vitest';

import type { CognitoAuthContextType, CognitoCoreConfig } from '../index';

describe('@granit/authentication-cognito types', () => {
  describe('CognitoAuthContextType', () => {
    it('should extend BaseAuthContextType with userPool field', () => {
      expectTypeOf<CognitoAuthContextType>().toHaveProperty('userPool');
      expectTypeOf<CognitoAuthContextType>().toHaveProperty('authenticated');
      expectTypeOf<CognitoAuthContextType>().toHaveProperty('loading');
      expectTypeOf<CognitoAuthContextType>().toHaveProperty('user');
      expectTypeOf<CognitoAuthContextType>().toHaveProperty('login');
      expectTypeOf<CognitoAuthContextType>().toHaveProperty('logout');
    });
  });

  describe('CognitoCoreConfig', () => {
    it('should require userPoolId, clientId, and region', () => {
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('userPoolId');
      expectTypeOf<CognitoCoreConfig['userPoolId']>().toBeString();
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('clientId');
      expectTypeOf<CognitoCoreConfig['clientId']>().toBeString();
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('region');
      expectTypeOf<CognitoCoreConfig['region']>().toBeString();
    });

    it('should have optional domain, scopes, and callbacks', () => {
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('domain');
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('scopes');
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('onTokenRefreshError');
      expectTypeOf<CognitoCoreConfig>().toHaveProperty('onSessionExpired');
    });
  });
});
