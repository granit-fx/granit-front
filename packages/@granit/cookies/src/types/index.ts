/**
 * RGPD/CCPA cookie consent categories — mirrors the C# `CookieCategory` enum
 * in `Granit.Http.Cookies`. Values match the snake_case strings serialized by
 * the backend (`CookieCategoryNames.ToSnakeCase`).
 *
 * Note: `sale_or_sharing` (CCPA "Sale or Sharing") is emitted with an explicit
 * snake_case mapping on the backend — a plain `ToLowerInvariant()` would have
 * glued the words into `saleorsharing`, so the mapping is spelled out there.
 */
export type CookieCategory =
  'strictly_necessary' | 'preferences' | 'analytics' | 'marketing' | 'sale_or_sharing';

/**
 * Current consent state for each category.
 */
export type ConsentState = Record<CookieCategory, boolean>;

/**
 * Consent model the CMP applied when capturing a decision — mirrors the C#
 * `CookieConsentMode` enum in `Granit.Http.Cookies`. Serialized by name.
 */
export type CookieConsentMode = 'OptIn' | 'OptOut' | 'Hybrid' | 'None';

/**
 * Body of `POST {basePath}/consent` (default `POST /cookies/consent`) — the
 * consent decision the CMP records in the server-side ledger for GDPR Art. 7(1)
 * accountability. Mirrors `ConsentDecisionRequest`.
 *
 * `grantedCategories` / `deniedCategories` are snake_case {@link CookieCategory}
 * names. `cmpSource` is the only required field (the backend marks the rest
 * optional and defaults `mode` to `OptIn`); the validator additionally requires
 * at least one category across the two lists.
 */
export interface ConsentDecisionRequest {
  /** Snake_case names of the categories the user granted. */
  readonly grantedCategories?: readonly string[] | null;
  /** Snake_case names of the categories the user denied. */
  readonly deniedCategories?: readonly string[] | null;
  /** Consent model the CMP applied; backend defaults to `OptIn` when omitted. */
  readonly mode?: CookieConsentMode | null;
  /** Identifier of the CMP that captured the decision (max 64 chars). */
  readonly cmpSource: string;
}

/**
 * Abstraction for a Consent Management Platform (vanilla-cookieconsent,
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
