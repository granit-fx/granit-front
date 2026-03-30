import { describe, expectTypeOf, it } from 'vitest';

import type { GoogleCloudAuthContextType, GoogleCloudCoreConfig } from '../index.js';

describe('@granit/authentication-google-cloud types', () => {
  describe('GoogleCloudAuthContextType', () => {
    it('should extend BaseAuthContextType with firebaseAuth field', () => {
      expectTypeOf<GoogleCloudAuthContextType>().toHaveProperty('firebaseAuth');
      expectTypeOf<GoogleCloudAuthContextType>().toHaveProperty('authenticated');
      expectTypeOf<GoogleCloudAuthContextType>().toHaveProperty('loading');
      expectTypeOf<GoogleCloudAuthContextType>().toHaveProperty('user');
      expectTypeOf<GoogleCloudAuthContextType>().toHaveProperty('login');
      expectTypeOf<GoogleCloudAuthContextType>().toHaveProperty('logout');
    });
  });

  describe('GoogleCloudCoreConfig', () => {
    it('should require apiKey, authDomain, and projectId', () => {
      expectTypeOf<GoogleCloudCoreConfig>().toHaveProperty('apiKey');
      expectTypeOf<GoogleCloudCoreConfig['apiKey']>().toBeString();
      expectTypeOf<GoogleCloudCoreConfig>().toHaveProperty('authDomain');
      expectTypeOf<GoogleCloudCoreConfig['authDomain']>().toBeString();
      expectTypeOf<GoogleCloudCoreConfig>().toHaveProperty('projectId');
      expectTypeOf<GoogleCloudCoreConfig['projectId']>().toBeString();
    });

    it('should have optional scopes and callbacks', () => {
      expectTypeOf<GoogleCloudCoreConfig>().toHaveProperty('scopes');
      expectTypeOf<GoogleCloudCoreConfig>().toHaveProperty('onTokenRefreshError');
      expectTypeOf<GoogleCloudCoreConfig>().toHaveProperty('onSessionExpired');
    });
  });
});
