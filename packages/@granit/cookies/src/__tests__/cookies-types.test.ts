import { describe, expectTypeOf, it } from 'vitest';

import type {
  ConsentState,
  CookieCategory,
  CookieConsentConfig,
  CookieConsentProvider,
  CookieDefinitionDto,
  ThirdPartyServiceDto,
} from '../index';

describe('@granit/cookies types', () => {
  describe('CookieCategory', () => {
    it('should accept RGPD categories', () => {
      expectTypeOf<'strictly_necessary'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'preferences'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'analytics'>().toMatchTypeOf<CookieCategory>();
      expectTypeOf<'marketing'>().toMatchTypeOf<CookieCategory>();
    });
  });

  describe('ConsentState', () => {
    it('should be a record of CookieCategory to boolean', () => {
      expectTypeOf<ConsentState>().toHaveProperty('strictly_necessary');
      expectTypeOf<ConsentState['strictly_necessary']>().toBeBoolean();
      expectTypeOf<ConsentState>().toHaveProperty('analytics');
      expectTypeOf<ConsentState['analytics']>().toBeBoolean();
    });
  });

  describe('CookieConsentProvider', () => {
    it('should have lifecycle methods', () => {
      expectTypeOf<CookieConsentProvider>().toHaveProperty('init');
      expectTypeOf<CookieConsentProvider>().toHaveProperty('getConsents');
      expectTypeOf<CookieConsentProvider>().toHaveProperty('onConsentChange');
      expectTypeOf<CookieConsentProvider>().toHaveProperty('setConsent');
      expectTypeOf<CookieConsentProvider>().toHaveProperty('setAllConsents');
      expectTypeOf<CookieConsentProvider>().toHaveProperty('hasConsented');
    });
  });

  describe('CookieConsentConfig', () => {
    it('should have cookies and services arrays', () => {
      expectTypeOf<CookieConsentConfig>().toHaveProperty('cookies');
      expectTypeOf<CookieConsentConfig>().toHaveProperty('services');
    });
  });

  describe('CookieDefinitionDto', () => {
    it('should have cookie metadata fields', () => {
      expectTypeOf<CookieDefinitionDto>().toHaveProperty('name');
      expectTypeOf<CookieDefinitionDto>().toHaveProperty('category');
      expectTypeOf<CookieDefinitionDto>().toHaveProperty('retentionDays');
      expectTypeOf<CookieDefinitionDto>().toHaveProperty('purpose');
    });
  });

  describe('ThirdPartyServiceDto', () => {
    it('should have service identification and cookie patterns', () => {
      expectTypeOf<ThirdPartyServiceDto>().toHaveProperty('name');
      expectTypeOf<ThirdPartyServiceDto>().toHaveProperty('category');
      expectTypeOf<ThirdPartyServiceDto>().toHaveProperty('cookiePatterns');
    });
  });
});
