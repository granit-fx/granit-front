import { describe, expectTypeOf, it } from 'vitest';

import type {
  ConsentState,
  CookieCategory,
  CookieConsentAdapter,
  CookieConsentConfigResponse,
  CookieDefinitionResponse,
  ThirdPartyServiceResponse,
} from '../index';

describe('@granit/cookies types', () => {
  describe('CookieCategory', () => {
    it('should accept RGPD/CCPA categories', () => {
      expectTypeOf<'strictly_necessary'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'preferences'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'analytics'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'marketing'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'saleorsharing'>().toMatchTypeOf<CookieCategory>();
    });
  });

  describe('ConsentState', () => {
    it('should be a record of CookieCategory to boolean', () => {
      expectTypeOf<ConsentState>().toHaveProperty('strictly_necessary');
      expectTypeOf<ConsentState['strictly_necessary']>().toBeBoolean();
      expectTypeOf<ConsentState>().toHaveProperty('analytics');
      expectTypeOf<ConsentState['analytics']>().toBeBoolean();
      expectTypeOf<ConsentState>().toHaveProperty('saleorsharing');
    });
  });

  describe('CookieConsentAdapter', () => {
    it('should have lifecycle methods', () => {
      expectTypeOf<CookieConsentAdapter>().toHaveProperty('init');
      expectTypeOf<CookieConsentAdapter>().toHaveProperty('getConsents');
      expectTypeOf<CookieConsentAdapter>().toHaveProperty('onConsentChange');
      expectTypeOf<CookieConsentAdapter>().toHaveProperty('setConsent');
      expectTypeOf<CookieConsentAdapter>().toHaveProperty('setAllConsents');
      expectTypeOf<CookieConsentAdapter>().toHaveProperty('hasConsented');
    });
  });

  describe('CookieConsentConfigResponse', () => {
    it('should have cookies and services arrays', () => {
      expectTypeOf<CookieConsentConfigResponse>().toHaveProperty('cookies');
      expectTypeOf<CookieConsentConfigResponse>().toHaveProperty('services');
    });
  });

  describe('CookieDefinitionResponse', () => {
    it('should have cookie metadata fields', () => {
      expectTypeOf<CookieDefinitionResponse>().toHaveProperty('name');
      expectTypeOf<CookieDefinitionResponse>().toHaveProperty('category');
      expectTypeOf<CookieDefinitionResponse>().toHaveProperty('retentionDays');
      expectTypeOf<CookieDefinitionResponse>().toHaveProperty('purpose');
    });
  });

  describe('ThirdPartyServiceResponse', () => {
    it('should have service identification and cookie patterns', () => {
      expectTypeOf<ThirdPartyServiceResponse>().toHaveProperty('name');
      expectTypeOf<ThirdPartyServiceResponse>().toHaveProperty('category');
      expectTypeOf<ThirdPartyServiceResponse>().toHaveProperty('cookiePatterns');
    });
  });
});
