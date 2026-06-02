import type { CookieConsentConfig } from '@granit/cookies';

/**
 * Maps `CookieCategory` keys to the category names used in the cc_cookie.
 * Defaults align with `@granit/cookies-cookieconsent` built-ins and the backend
 * `Granit.Http.Cookies.CookieConsent` defaults.
 */
export interface CategoryNames {
  /** cc_cookie name for the `preferences` category. Default: `"functional"`. */
  readonly preferences: string;
  /** cc_cookie name for the `analytics` category. Default: `"analytics"`. */
  readonly analytics: string;
  /** cc_cookie name for the `marketing` category. Default: `"marketing"`. */
  readonly marketing: string;
}

/**
 * Options for creating a CookieConsent provider backed by vanilla-cookieconsent.
 */
export interface CreateCookieConsentProviderOptions {
  /**
   * Loads the CMP-agnostic cookie configuration from the backend API.
   * When provided, the adapter builds the category list from the service
   * definitions returned by the API.
   */
  readonly loadConfig?: () => Promise<CookieConsentConfig>;

  /**
   * Name of the cookie used to persist consent.
   * Must match `Http:Cookies:CookieConsent:CookieName` on the backend.
   *
   * @default 'cc_cookie'
   */
  readonly cookieName?: string;

  /**
   * Override the category names written into the cc_cookie.
   * Only needed if the backend is configured with non-default names.
   */
  readonly categoryNames?: Partial<CategoryNames>;
}

/**
 * Minimal interface for the vanilla-cookieconsent singleton used by the adapter.
 * Typed against the subset of the `vanilla-cookieconsent` public API we rely on.
 */
export interface VanillaCookieConsent {
  run(config: VanillaCookieConsentConfig): Promise<void>;
  acceptCategory(categories: string | string[], excluded?: string[]): void;
  acceptedCategory(categoryName: string): boolean;
  validConsent(): boolean;
  getUserPreferences(): { acceptedCategories: string[]; rejectedCategories: string[] };
}

export interface VanillaCookieConsentConfig {
  categories: Record<string, { enabled?: boolean; readOnly?: boolean }>;
  onConsent?: () => void;
  onChange?: () => void;
  cookie?: { name?: string };
  disablePageInteraction?: boolean;
  autoShow?: boolean;
}
