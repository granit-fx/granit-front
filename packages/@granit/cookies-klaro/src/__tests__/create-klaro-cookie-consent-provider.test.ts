import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

import { createKlaroCookieConsentProvider } from '../adapters/create-klaro-cookie-consent-provider';

import type { KlaroConsentManager, KlaroConfig, KlaroWatcher } from '../types/index';

const mockManager: KlaroConsentManager = {
  getConsent: vi.fn(),
  updateConsent: vi.fn(),
  changeAll: vi.fn(),
  saveAndApplyConsents: vi.fn(),
  watch: vi.fn(),
};

vi.mock('klaro/dist/klaro-no-css', () => ({
  getManager: () => mockManager,
}));

const klaroConfig: KlaroConfig = {
  services: [
    { name: 'google-analytics', purposes: ['analytics'] },
    { name: 'matomo', purposes: ['analytics'] },
    { name: 'youtube', purposes: ['marketing'] },
  ],
};

const serviceMappings = [
  { name: 'google-analytics', category: 'analytics' as const },
  { name: 'matomo', category: 'analytics' as const },
  { name: 'youtube', category: 'marketing' as const },
];

describe('createKlaroCookieConsentProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default consents before init', () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });

    const consents = provider.getConsents();

    expect(consents.strictly_necessary).toBe(true);
    expect(consents.analytics).toBe(false);
    expect(consents.marketing).toBe(false);
  });

  it('should initialize Klaro manager on init()', async () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });

    await provider.init();

    vi.mocked(mockManager.getConsent).mockReturnValue(false);
    const consents = provider.getConsents();
    expect(consents.strictly_necessary).toBe(true);
  });

  it('should return true for category when all services consented', async () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });
    await provider.init();

    vi.mocked(mockManager.getConsent).mockImplementation((name: string) => {
      return name === 'google-analytics' || name === 'matomo';
    });

    const consents = provider.getConsents();

    expect(consents.analytics).toBe(true);
    expect(consents.marketing).toBe(false);
  });

  it('should return false for category when one service not consented (all-or-nothing)', async () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });
    await provider.init();

    vi.mocked(mockManager.getConsent).mockImplementation((name: string) => {
      return name === 'google-analytics';
    });

    const consents = provider.getConsents();

    expect(consents.analytics).toBe(false);
  });

  it('should always keep strictly_necessary true', async () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });
    await provider.init();

    vi.mocked(mockManager.getConsent).mockReturnValue(false);
    const consents = provider.getConsents();

    expect(consents.strictly_necessary).toBe(true);
  });

  it('should watch the manager and call back on change via onConsentChange', async () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });
    await provider.init();

    let capturedWatcher: KlaroWatcher | undefined;
    vi.mocked(mockManager.watch).mockImplementation((watcher: KlaroWatcher) => {
      capturedWatcher = watcher;
    });

    const callback = vi.fn();
    provider.onConsentChange(callback);

    expect(mockManager.watch).toHaveBeenCalledOnce();

    vi.mocked(mockManager.getConsent).mockReturnValue(true);
    capturedWatcher?.update({}, 'consents', {});

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        strictly_necessary: true,
        analytics: true,
        marketing: true,
      })
    );
  });

  it('should replace update with no-op on onConsentChange cleanup', async () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });
    await provider.init();

    let capturedWatcher: KlaroWatcher | undefined;
    vi.mocked(mockManager.watch).mockImplementation((watcher: KlaroWatcher) => {
      capturedWatcher = watcher;
    });

    const callback = vi.fn();
    const unsubscribe = provider.onConsentChange(callback);

    unsubscribe();

    vi.mocked(mockManager.getConsent).mockReturnValue(true);
    capturedWatcher?.update({}, 'consents', {});

    expect(callback).not.toHaveBeenCalled();
  });

  it('should return no-op from onConsentChange when manager not initialized', () => {
    const provider = createKlaroCookieConsentProvider({
      klaroConfig,
      serviceMappings,
    });

    const callback = vi.fn();
    const unsubscribe = provider.onConsentChange(callback);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  describe('setConsent', () => {
    it('should set consent for all services in a category and persist', async () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });
      await provider.init();

      provider.setConsent('analytics', true);

      expect(mockManager.updateConsent).toHaveBeenCalledWith('google-analytics', true);
      expect(mockManager.updateConsent).toHaveBeenCalledWith('matomo', true);
      expect(mockManager.saveAndApplyConsents).toHaveBeenCalledOnce();
    });

    it('should ignore strictly_necessary category', async () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });
      await provider.init();

      provider.setConsent('strictly_necessary', true);

      expect(mockManager.updateConsent).not.toHaveBeenCalled();
      expect(mockManager.saveAndApplyConsents).not.toHaveBeenCalled();
    });

    it('should be a no-op when manager not initialized', () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });

      provider.setConsent('analytics', true);

      expect(mockManager.updateConsent).not.toHaveBeenCalled();
    });
  });

  describe('setAllConsents', () => {
    it('should accept all services via changeAll and persist', async () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });
      await provider.init();

      provider.setAllConsents(true);

      expect(mockManager.changeAll).toHaveBeenCalledWith(true);
      expect(mockManager.saveAndApplyConsents).toHaveBeenCalledOnce();
    });

    it('should revoke all services via changeAll', async () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });
      await provider.init();

      provider.setAllConsents(false);

      expect(mockManager.changeAll).toHaveBeenCalledWith(false);
      expect(mockManager.saveAndApplyConsents).toHaveBeenCalledOnce();
    });

    it('should be a no-op when manager not initialized', () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });

      provider.setAllConsents(true);

      expect(mockManager.changeAll).not.toHaveBeenCalled();
    });

    it('should call saveAndApplyConsents which persists the cookie', async () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });
      await provider.init();

      provider.setAllConsents(true);

      expect(mockManager.changeAll).toHaveBeenCalledWith(true);
      expect(mockManager.saveAndApplyConsents).toHaveBeenCalledOnce();
    });
  });

  describe('loadConfig (dynamic mode)', () => {
    it('should build KlaroConfig and serviceMappings from API response', async () => {
      const provider = createKlaroCookieConsentProvider({
        loadConfig: async () => ({
          cookies: [],
          services: [
            { name: 'google-analytics', category: 'analytics', cookiePatterns: ['^_ga', '^_gid'] },
            { name: 'youtube', category: 'marketing', cookiePatterns: ['^YSC'] },
          ],
        }),
      });

      await provider.init();

      vi.mocked(mockManager.getConsent).mockImplementation((name: string) => {
        return name === 'google-analytics';
      });

      const consents = provider.getConsents();
      expect(consents.analytics).toBe(true); // only GA in analytics, and it's consented
      expect(consents.marketing).toBe(false); // youtube not consented
    });

    it('should resolve all services in category from dynamic config', async () => {
      const provider = createKlaroCookieConsentProvider({
        loadConfig: async () => ({
          cookies: [],
          services: [{ name: 'ga', category: 'analytics', cookiePatterns: [] }],
        }),
      });

      await provider.init();

      vi.mocked(mockManager.getConsent).mockReturnValue(true);
      const consents = provider.getConsents();
      expect(consents.analytics).toBe(true);
    });

    it('should use cookieName option in dynamic mode', async () => {
      document.cookie = 'my-cmp=%7B%7D';

      const provider = createKlaroCookieConsentProvider({
        cookieName: 'my-cmp',
        loadConfig: async () => ({ cookies: [], services: [] }),
      });

      expect(provider.hasConsented()).toBe(true);

      document.cookie = 'my-cmp=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });

    it('should throw when neither loadConfig nor klaroConfig is provided', async () => {
      const provider = createKlaroCookieConsentProvider({});

      await expect(provider.init()).rejects.toThrow(
        'createKlaroCookieConsentProvider: provide either loadConfig or klaroConfig'
      );
    });

    it('should ignore static klaroConfig when loadConfig is provided', async () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig, // static config with 3 services
        serviceMappings, // static mappings
        loadConfig: async () => ({
          cookies: [],
          services: [{ name: 'only-service', category: 'marketing', cookiePatterns: [] }],
        }),
      });

      await provider.init();

      vi.mocked(mockManager.getConsent).mockReturnValue(true);
      const consents = provider.getConsents();
      // analytics should be false because dynamic config has no analytics services
      expect(consents.analytics).toBe(false);
      expect(consents.marketing).toBe(true);
    });
  });

  describe('hasConsented', () => {
    afterEach(() => {
      // Clean up cookies
      document.cookie = 'klaro=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });

    it('should return false when no klaro cookie exists', () => {
      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });

      expect(provider.hasConsented()).toBe(false);
    });

    it('should return true when klaro cookie exists', () => {
      document.cookie = 'klaro=%7B%7D';

      const provider = createKlaroCookieConsentProvider({
        klaroConfig,
        serviceMappings,
      });

      expect(provider.hasConsented()).toBe(true);
    });

    it('should use custom cookieName from config', () => {
      document.cookie = 'my-consent=%7B%7D';

      const provider = createKlaroCookieConsentProvider({
        klaroConfig: { ...klaroConfig, cookieName: 'my-consent' },
        serviceMappings,
      });

      expect(provider.hasConsented()).toBe(true);

      document.cookie = 'my-consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
  });
});
