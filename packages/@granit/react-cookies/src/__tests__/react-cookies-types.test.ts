import { describe, expectTypeOf, it } from 'vitest';

import type { CookieConsentContextValue } from '../types/index';

describe('@granit/react-cookies types', () => {
  describe('CookieConsentContextValue', () => {
    it('should expose consent state and loading', () => {
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('consents');
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('isLoaded');
      expectTypeOf<CookieConsentContextValue['isLoaded']>().toBeBoolean();
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('hasConsented');
    });

    it('should expose consent management methods', () => {
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('acceptCategory');
      expectTypeOf<CookieConsentContextValue['acceptCategory']>().toBeFunction();
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('revokeCategory');
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('acceptAll');
      expectTypeOf<CookieConsentContextValue>().toHaveProperty('revokeAll');
    });
  });
});
