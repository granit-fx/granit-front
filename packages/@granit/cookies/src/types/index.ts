/**
 * RGPD cookie consent categories — mirrors the C# CookieCategory enum.
 */
export type CookieCategory = 'strictly_necessary' | 'preferences' | 'analytics' | 'marketing';

/**
 * Current consent state for each category.
 */
export type ConsentState = Record<CookieCategory, boolean>;

/**
 * Abstraction for a Consent Management Platform (Klaro, Cookiebot, etc.).
 * Applications provide their own implementation.
 */
export interface CookieConsentProvider {
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
 * API response from `GET /api/v1/cookies/config`.
 * CMP-agnostic contract between the backend and any CMP adapter.
 */
export interface CookieConsentConfig {
  /** Internal cookies registered by the application. */
  readonly cookies: readonly CookieDefinitionDto[];
  /** Third-party services that set cookies on the client. */
  readonly services: readonly ThirdPartyServiceDto[];
}

/**
 * Internal cookie definition (from backend registry).
 */
export interface CookieDefinitionDto {
  readonly name: string;
  readonly category: CookieCategory;
  readonly retentionDays: number;
  readonly purpose: string;
}

/**
 * Third-party service that sets cookies (from backend config).
 */
export interface ThirdPartyServiceDto {
  readonly name: string;
  readonly category: CookieCategory;
  readonly cookiePatterns: readonly string[];
}
