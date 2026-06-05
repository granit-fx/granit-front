import { defaultConsentState } from '@granit/cookies';

import type {
  CreateKlaroCookieConsentProviderOptions,
  KlaroConfig,
  KlaroConsentManager,
  KlaroServiceMapping,
  KlaroWatcher,
} from '../types/index';
import type {
  CookieCategory,
  CookieConsentConfigResponse,
  CookieConsentAdapter,
  ConsentState,
} from '@granit/cookies';

const ALL_CATEGORIES: readonly CookieCategory[] = [
  'strictly_necessary',
  'preferences',
  'analytics',
  'marketing',
  'saleorsharing',
];

/**
 * Builds a `ConsentState` from the Klaro consent manager and service mappings.
 * Uses all-or-nothing logic per category (same as the backend).
 */
function buildConsentState(
  manager: KlaroConsentManager,
  serviceMappings: readonly KlaroServiceMapping[]
): ConsentState {
  const state: ConsentState = defaultConsentState();

  for (const category of ALL_CATEGORIES) {
    if (category === 'strictly_necessary') continue;

    const services = serviceMappings.filter((m) => m.category === category);
    if (services.length === 0) continue;

    state[category] = services.every((s) => manager.getConsent(s.name));
  }

  return state;
}

/**
 * Converts a `CookieConsentConfigResponse` (API response) into `KlaroConfig` + `KlaroServiceMapping[]`.
 */
function buildKlaroConfigFromApi(
  config: CookieConsentConfigResponse,
  cookieName: string
): { klaroConfig: KlaroConfig; serviceMappings: KlaroServiceMapping[] } {
  const serviceMappings: KlaroServiceMapping[] = config.services.map((s) => ({
    name: s.name,
    category: s.category,
  }));

  const klaroConfig: KlaroConfig = {
    cookieName,
    services: config.services.map((s) => ({
      name: s.name,
      purposes: [s.category],
      cookies: s.cookiePatterns.map((p) => new RegExp(p)),
    })),
  };

  return { klaroConfig, serviceMappings };
}

/**
 * Creates a `CookieConsentAdapter` backed by Klaro CMP.
 *
 * Supports two modes:
 * - **Static**: pass `klaroConfig` + `serviceMappings` directly.
 * - **Dynamic**: pass `loadConfig` to fetch the configuration from the backend API.
 *
 * @example
 * ```ts
 * // Dynamic mode (recommended) — config loaded from API
 * const provider = createKlaroCookieConsentProvider({
 *   loadConfig: () => apiClient.get("/cookies/config").then(r => r.data),
 *   cookieName: "klaro",
 * });
 *
 * // Static mode — config provided at creation time
 * const provider = createKlaroCookieConsentProvider({
 *   klaroConfig: { services: [...] },
 *   serviceMappings: [{ name: "matomo", category: "analytics" }],
 * });
 * ```
 */
export function createKlaroCookieConsentProvider(
  options: CreateKlaroCookieConsentProviderOptions
): CookieConsentAdapter {
  const cookieName = options.cookieName ?? options.klaroConfig?.cookieName ?? 'klaro';
  let manager: KlaroConsentManager | null = null;
  let resolvedMappings: readonly KlaroServiceMapping[] = options.serviceMappings ?? [];

  return {
    async init() {
      let klaroConfig: KlaroConfig;

      if (options.loadConfig) {
        const apiConfig = await options.loadConfig();
        const built = buildKlaroConfigFromApi(apiConfig, cookieName);
        klaroConfig = built.klaroConfig;
        resolvedMappings = built.serviceMappings;
      } else if (options.klaroConfig) {
        klaroConfig = options.klaroConfig;
      } else {
        throw new Error(
          'createKlaroCookieConsentProvider: provide either loadConfig or klaroConfig'
        );
      }

      const klaro = await import('klaro/dist/klaro-no-css');
      manager = klaro.getManager(klaroConfig) as KlaroConsentManager;
    },

    getConsents() {
      if (!manager) {
        return defaultConsentState();
      }
      return buildConsentState(manager, resolvedMappings);
    },

    onConsentChange(callback) {
      if (!manager) return () => {};

      const watcher: KlaroWatcher = {
        update() {
          if (manager) {
            callback(buildConsentState(manager, resolvedMappings));
          }
        },
      };

      manager.watch(watcher);

      return () => {
        watcher.update = () => {};
      };
    },

    setConsent(category, granted) {
      if (!manager || category === 'strictly_necessary') return;

      const services = resolvedMappings.filter((m) => m.category === category);
      for (const service of services) {
        manager.updateConsent(service.name, granted);
      }
      manager.saveAndApplyConsents();
    },

    setAllConsents(granted) {
      if (!manager) return;

      manager.changeAll(granted);
      manager.saveAndApplyConsents();
    },

    hasConsented() {
      return document.cookie.split(';').some((c) => c.trim().startsWith(`${cookieName}=`));
    },
  };
}
