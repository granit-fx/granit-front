import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCookieConsentProvider } from '../adapters/create-cookie-consent-provider';

import type { VanillaCookieConsent } from '../types/index';

const mockCc: VanillaCookieConsent = {
  run: vi.fn(),
  acceptCategory: vi.fn(),
  acceptedCategory: vi.fn(),
  validConsent: vi.fn(),
  getUserPreferences: vi.fn(),
};

vi.mock('vanilla-cookieconsent', () => ({
  default: mockCc,
}));

describe('createCookieConsentProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockCc.run).mockResolvedValue(undefined);
    vi.mocked(mockCc.acceptedCategory).mockReturnValue(false);
    vi.mocked(mockCc.validConsent).mockReturnValue(false);
    vi.mocked(mockCc.getUserPreferences).mockReturnValue({
      acceptedCategories: ['necessary'],
      rejectedCategories: ['functional', 'analytics', 'marketing'],
    });
  });

  afterEach(() => {
    document.cookie = 'cc_cookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  describe('getConsents — before init', () => {
    it('returns all-false defaults before init', () => {
      const provider = createCookieConsentProvider();
      const state = provider.getConsents();

      expect(state.strictly_necessary).toBe(true);
      expect(state.preferences).toBe(false);
      expect(state.analytics).toBe(false);
      expect(state.marketing).toBe(false);
    });
  });

  describe('init', () => {
    it('calls cc.run with necessary category as readOnly and optional categories', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      expect(mockCc.run).toHaveBeenCalledOnce();
      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.categories).toMatchObject({
        necessary: { enabled: true, readOnly: true },
        functional: {},
        analytics: {},
        marketing: {},
      });
    });

    it('uses default cookie name cc_cookie', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.cookie?.name).toBe('cc_cookie');
    });

    it('uses custom cookieName option', async () => {
      const provider = createCookieConsentProvider({ cookieName: 'my_consent' });
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.cookie?.name).toBe('my_consent');
    });

    it('sets autoShow: false for headless operation', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.autoShow).toBe(false);
    });

    it('passes a language block with a translation for the default language', async () => {
      // vanilla-cookieconsent's run() reads language.translations and throws
      // if the default language has no (truthy) translation entry, even in
      // headless mode. Regression guard for that crash.
      const provider = createCookieConsentProvider();
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.language?.default).toBe('en');
      expect(config?.language?.translations).toHaveProperty('en');
      expect(config?.language?.translations.en).toBeTruthy();
    });
  });

  describe('getConsents — after init', () => {
    it('maps acceptedCategory results to ConsentState', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      vi.mocked(mockCc.acceptedCategory).mockImplementation((cat) => cat === 'analytics');

      const state = provider.getConsents();
      expect(state.strictly_necessary).toBe(true);
      expect(state.preferences).toBe(false); // functional not accepted
      expect(state.analytics).toBe(true);
      expect(state.marketing).toBe(false);
    });

    it('strictly_necessary is always true regardless of acceptedCategory', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      vi.mocked(mockCc.acceptedCategory).mockReturnValue(false);

      expect(provider.getConsents().strictly_necessary).toBe(true);
    });
  });

  describe('onConsentChange', () => {
    it('subscribes and receives consent state on onChange callback', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      const callback = vi.fn();
      provider.onConsentChange(callback);

      vi.mocked(mockCc.acceptedCategory).mockImplementation((cat) => cat === 'analytics');

      // Retrieve the onChange function registered with cc.run and invoke it
      const runConfig = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      runConfig?.onChange?.();

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          strictly_necessary: true,
          analytics: true,
          preferences: false,
          marketing: false,
        })
      );
    });

    it('fires subscribers on onConsent callback (page reload)', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      const callback = vi.fn();
      provider.onConsentChange(callback);

      const runConfig = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      runConfig?.onConsent?.();

      expect(callback).toHaveBeenCalledOnce();
    });

    it('unsubscribes when the returned function is called', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      const callback = vi.fn();
      const unsubscribe = provider.onConsentChange(callback);
      unsubscribe();

      const runConfig = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      runConfig?.onChange?.();

      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple independent subscribers', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      provider.onConsentChange(cb1);
      provider.onConsentChange(cb2);

      const runConfig = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      runConfig?.onChange?.();

      expect(cb1).toHaveBeenCalledOnce();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('returns no-op from onConsentChange before init', () => {
      const provider = createCookieConsentProvider();

      const callback = vi.fn();
      const unsubscribe = provider.onConsentChange(callback);

      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('setConsent', () => {
    it('adds category to accepted list when granting', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      vi.mocked(mockCc.getUserPreferences).mockReturnValue({
        acceptedCategories: ['necessary'],
        rejectedCategories: ['functional', 'analytics', 'marketing'],
      });

      provider.setConsent('analytics', true);

      expect(mockCc.acceptCategory).toHaveBeenCalledWith(['analytics']);
    });

    it('keeps existing accepted categories when adding a new one', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      vi.mocked(mockCc.getUserPreferences).mockReturnValue({
        acceptedCategories: ['necessary', 'functional'],
        rejectedCategories: ['analytics', 'marketing'],
      });

      provider.setConsent('analytics', true);

      expect(mockCc.acceptCategory).toHaveBeenCalledWith(
        expect.arrayContaining(['functional', 'analytics'])
      );
    });

    it('removes category from accepted list when revoking', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      vi.mocked(mockCc.getUserPreferences).mockReturnValue({
        acceptedCategories: ['necessary', 'functional', 'analytics'],
        rejectedCategories: ['marketing'],
      });

      provider.setConsent('analytics', false);

      expect(mockCc.acceptCategory).toHaveBeenCalledWith(['functional']);
    });

    it('ignores strictly_necessary — cannot be changed', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      provider.setConsent('strictly_necessary', true);

      expect(mockCc.acceptCategory).not.toHaveBeenCalled();
    });

    it('is a no-op before init', () => {
      const provider = createCookieConsentProvider();
      provider.setConsent('analytics', true);

      expect(mockCc.acceptCategory).not.toHaveBeenCalled();
    });
  });

  describe('setAllConsents', () => {
    it('accepts all optional categories when granted=true', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      provider.setAllConsents(true);

      expect(mockCc.acceptCategory).toHaveBeenCalledWith(
        expect.arrayContaining(['functional', 'analytics', 'marketing'])
      );
    });

    it('accepts empty array when granted=false (keeps only readOnly necessary)', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      provider.setAllConsents(false);

      expect(mockCc.acceptCategory).toHaveBeenCalledWith([]);
    });

    it('is a no-op before init', () => {
      const provider = createCookieConsentProvider();
      provider.setAllConsents(true);

      expect(mockCc.acceptCategory).not.toHaveBeenCalled();
    });
  });

  describe('hasConsented', () => {
    it('returns false before init', () => {
      const provider = createCookieConsentProvider();
      expect(provider.hasConsented()).toBe(false);
    });

    it('delegates to cc.validConsent() after init', async () => {
      const provider = createCookieConsentProvider();
      await provider.init();

      vi.mocked(mockCc.validConsent).mockReturnValue(true);
      expect(provider.hasConsented()).toBe(true);

      vi.mocked(mockCc.validConsent).mockReturnValue(false);
      expect(provider.hasConsented()).toBe(false);
    });
  });

  describe('categoryNames override', () => {
    it('uses custom category names in cc.run config', async () => {
      const provider = createCookieConsentProvider({
        categoryNames: { analytics: 'stats', marketing: 'ads' },
      });
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.categories).toHaveProperty('stats');
      expect(config?.categories).toHaveProperty('ads');
      expect(config?.categories).not.toHaveProperty('analytics');
      expect(config?.categories).not.toHaveProperty('marketing');
    });

    it('reads from custom category names via acceptedCategory', async () => {
      const provider = createCookieConsentProvider({
        categoryNames: { analytics: 'stats' },
      });
      await provider.init();

      vi.mocked(mockCc.acceptedCategory).mockImplementation((cat) => cat === 'stats');

      const state = provider.getConsents();
      expect(state.analytics).toBe(true);
    });
  });

  describe('loadConfig (dynamic mode)', () => {
    it('registers only categories present in service list', async () => {
      const provider = createCookieConsentProvider({
        loadConfig: async () => ({
          cookies: [],
          services: [
            { name: 'ga', category: 'analytics', cookiePatterns: [] },
            { name: 'fb', category: 'marketing', cookiePatterns: [] },
          ],
        }),
      });
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.categories).toHaveProperty('analytics');
      expect(config?.categories).toHaveProperty('marketing');
      expect(config?.categories).not.toHaveProperty('functional');
    });

    it('includes all default categories when all are present in services', async () => {
      const provider = createCookieConsentProvider({
        loadConfig: async () => ({
          cookies: [],
          services: [
            { name: 's1', category: 'analytics', cookiePatterns: [] },
            { name: 's2', category: 'marketing', cookiePatterns: [] },
            { name: 's3', category: 'preferences', cookiePatterns: [] },
          ],
        }),
      });
      await provider.init();

      const config = vi.mocked(mockCc.run).mock.calls[0]?.[0];
      expect(config?.categories).toHaveProperty('analytics');
      expect(config?.categories).toHaveProperty('marketing');
      expect(config?.categories).toHaveProperty('functional');
    });
  });
});
