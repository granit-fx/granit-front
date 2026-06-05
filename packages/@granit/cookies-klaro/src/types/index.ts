import type { CookieCategory, CookieConsentConfigResponse } from '@granit/cookies';

/**
 * Maps a Klaro service name to a RGPD cookie category.
 */
export interface KlaroServiceMapping {
  /** Service name as declared in the Klaro configuration. */
  readonly name: string;
  /** RGPD cookie category this service belongs to. */
  readonly category: CookieCategory;
}

/**
 * Klaro configuration object (minimal subset used by the adapter).
 * Full type is provided by Klaro itself.
 */
export interface KlaroConfig {
  /** Klaro element ID. */
  readonly elementID?: string;
  /** Cookie name used by Klaro. */
  readonly cookieName?: string;
  /** Klaro services configuration. */
  readonly services: ReadonlyArray<{
    readonly name: string;
    readonly purposes: readonly string[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Options for creating the Klaro cookie consent provider.
 *
 * Two modes:
 * - **Static**: provide `klaroConfig` + `serviceMappings` directly.
 * - **Dynamic**: provide `loadConfig` to fetch `CookieConsentConfig` from the API.
 *   The adapter builds the Klaro config and service mappings at `init()` time.
 *
 * When `loadConfig` is provided, `klaroConfig` and `serviceMappings` are ignored.
 */
export interface CreateKlaroCookieConsentProviderOptions {
  /** Full Klaro configuration to pass to `klaro.getManager()`. */
  readonly klaroConfig?: KlaroConfig;
  /** Mapping of Klaro service names to RGPD categories. */
  readonly serviceMappings?: readonly KlaroServiceMapping[];
  /**
   * Loads the CMP-agnostic cookie configuration from the backend API.
   * When provided, `klaroConfig` and `serviceMappings` are built automatically.
   */
  readonly loadConfig?: () => Promise<CookieConsentConfigResponse>;
  /** Cookie name used by Klaro to store consent. Default: `"klaro"`. */
  readonly cookieName?: string;
}

/**
 * Klaro consent manager interface (minimal subset used by the adapter).
 */
export interface KlaroConsentManager {
  getConsent(name: string): boolean;
  updateConsent(name: string, value: boolean): boolean;
  changeAll(value: boolean): number;
  saveAndApplyConsents(): void;
  watch(watcher: KlaroWatcher): void;
}

/**
 * Klaro watcher interface for consent changes.
 */
export interface KlaroWatcher {
  update(obj: unknown, name: string, data: unknown): void;
}
