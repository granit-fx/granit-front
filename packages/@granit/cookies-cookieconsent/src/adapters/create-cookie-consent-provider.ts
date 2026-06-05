import { defaultConsentState } from '@granit/cookies';

import type {
  CategoryNames,
  CreateCookieConsentProviderOptions,
  VanillaCookieConsent,
} from '../types/index';
import type { CookieCategory, CookieConsentAdapter, ConsentState } from '@granit/cookies';

const DEFAULT_CATEGORY_NAMES: CategoryNames = {
  preferences: 'functional',
  analytics: 'analytics',
  marketing: 'marketing',
  saleorsharing: 'sale_or_sharing',
};

/** Category name for the always-on necessary category in vanilla-cookieconsent. */
const NECESSARY_CATEGORY = 'necessary';

function buildConsentState(cc: VanillaCookieConsent, names: CategoryNames): ConsentState {
  return {
    ...defaultConsentState(),
    preferences: cc.acceptedCategory(names.preferences),
    analytics: cc.acceptedCategory(names.analytics),
    marketing: cc.acceptedCategory(names.marketing),
    saleorsharing: cc.acceptedCategory(names.saleorsharing),
  };
}

/**
 * Creates a `CookieConsentAdapter` backed by vanilla-cookieconsent (cc_cookie format).
 *
 * The adapter operates in headless mode — it manages consent state without
 * rendering any UI. The consuming application is responsible for showing the
 * consent banner and calling the provider methods.
 *
 * @example
 * ```ts
 * import { getCookieConsentConfig } from '@granit/cookies';
 *
 * const provider = createCookieConsentProvider({
 *   loadConfig: () => getCookieConsentConfig(apiClient, '/cookies'),
 *   cookieName: 'cc_cookie',
 * });
 * ```
 */
export function createCookieConsentProvider(
  options: CreateCookieConsentProviderOptions = {}
): CookieConsentAdapter {
  const cookieName = options.cookieName ?? 'cc_cookie';
  const resolvedNames: CategoryNames = {
    ...DEFAULT_CATEGORY_NAMES,
    ...options.categoryNames,
  };

  let cc: VanillaCookieConsent | null = null;
  const subscribers = new Set<(state: ConsentState) => void>();

  function notify(): void {
    if (!cc) return;
    const state = buildConsentState(cc, resolvedNames);
    for (const callback of subscribers) {
      callback(state);
    }
  }

  return {
    async init() {
      const mod = await import('vanilla-cookieconsent');
      // vanilla-cookieconsent uses a CommonJS-style namespace export
      cc = (mod.default ?? mod) as VanillaCookieConsent;

      const optionalCategories: Record<string, object> = {
        [resolvedNames.preferences]: {},
        [resolvedNames.analytics]: {},
        [resolvedNames.marketing]: {},
        [resolvedNames.saleorsharing]: {},
      };

      if (options.loadConfig) {
        const config = await options.loadConfig();
        // Derive which optional categories are actually in use from the service list.
        // Categories absent from the service list are still registered so the
        // cookie schema stays consistent with the backend defaults.
        const activeCategories = new Set(config.services.map((s) => s.category));
        const categoryMap: Partial<Record<CookieCategory, string>> = {
          preferences: resolvedNames.preferences,
          analytics: resolvedNames.analytics,
          marketing: resolvedNames.marketing,
          saleorsharing: resolvedNames.saleorsharing,
        };
        for (const [granitCat, ccName] of Object.entries(categoryMap)) {
          if (!activeCategories.has(granitCat as CookieCategory)) {
            delete optionalCategories[ccName];
          }
        }
      }

      await cc.run({
        categories: {
          [NECESSARY_CATEGORY]: { enabled: true, readOnly: true },
          ...optionalCategories,
        },
        onConsent: notify,
        onChange: notify,
        cookie: { name: cookieName },
        autoShow: false,
      });
    },

    getConsents(): ConsentState {
      if (!cc) {
        return defaultConsentState();
      }
      return buildConsentState(cc, resolvedNames);
    },

    onConsentChange(callback) {
      if (!cc) return () => {};
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },

    setConsent(category: CookieCategory, granted: boolean): void {
      if (!cc || category === 'strictly_necessary') return;

      const ccName = resolvedNames[category];
      const prefs = cc.getUserPreferences();
      const currentOptional = prefs.acceptedCategories.filter((c) => c !== NECESSARY_CATEGORY);

      const next = granted
        ? [...new Set([...currentOptional, ccName])]
        : currentOptional.filter((c) => c !== ccName);

      cc.acceptCategory(next);
    },

    setAllConsents(granted: boolean): void {
      if (!cc) return;

      if (granted) {
        cc.acceptCategory(Object.values(resolvedNames));
      } else {
        cc.acceptCategory([]);
      }
    },

    hasConsented(): boolean {
      return cc?.validConsent() ?? false;
    },
  };
}
