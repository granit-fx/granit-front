/**
 * RGPD/CCPA cookie consent categories — mirrors the C# `CookieCategory` enum
 * in `Granit.Http.Cookies`. Values match the snake_case strings serialized by
 * the backend (`CookieConsentConfigProvider.CategoryToSnakeCase`).
 *
 * Note: `saleorsharing` (CCPA "Sale or Sharing") is serialized without an
 * underscore by the backend's `ToLowerInvariant()` fallback — keep it verbatim.
 */
export type CookieCategory =
  | 'strictly_necessary'
  | 'preferences'
  | 'analytics'
  | 'marketing'
  | 'saleorsharing';

/**
 * Current consent state for each category.
 */
export type ConsentState = Record<CookieCategory, boolean>;

/**
 * Abstraction for a Consent Management Platform (Klaro, vanilla-cookieconsent,
 * Cookiebot, etc.). Adapter packages provide their own implementation.
 */
export interface CookieConsentAdapter {
  /** Initializes the CMP (loads SDK, reads existing consent). */
  init(): Promise<void>;

  /** Returns the current consent state for all categories. */
  getConsents(): ConsentState;

  /**
   * Subscribes to consent changes. Returns an unsubscribe function.
   * Called when the user updates their consent preferences.
   */
  onConsentChange(callback: (consents: ConsentState) => void): () => void;

  /** Sets consent for a single category and persists it in the CMP. */
  setConsent(category: CookieCategory, granted: boolean): void;

  /** Sets consent for all non-essential categories and persists it in the CMP. */
  setAllConsents(granted: boolean): void;

  /** Returns true if the user has already made a consent choice. */
  hasConsented(): boolean;
}

/**
 * API response from `GET {basePath}/config` (default `GET /cookies/config`).
 * Mirrors `CookieConsentConfigResponse` — CMP-agnostic contract between the
 * backend and any CMP adapter.
 */
export interface CookieConsentConfigResponse {
  /** Internal cookies registered by the application. */
  readonly cookies: readonly CookieDefinitionResponse[];
  /** Third-party services that set cookies on the client. */
  readonly services: readonly ThirdPartyServiceResponse[];
}

/**
 * Internal cookie definition (from backend registry).
 * Mirrors `CookieDefinitionResponse`.
 */
export interface CookieDefinitionResponse {
  readonly name: string;
  readonly category: CookieCategory;
  readonly retentionDays: number;
  readonly purpose: string;
}

/**
 * Third-party service that sets cookies (from backend config).
 * Mirrors `ThirdPartyServiceResponse`.
 */
export interface ThirdPartyServiceResponse {
  readonly name: string;
  readonly category: CookieCategory;
  readonly cookiePatterns: readonly string[];
}
