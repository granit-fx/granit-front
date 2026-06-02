import type { CookieCategory, ConsentState } from '@granit/cookies';

/**
 * Value exposed by the CookieConsentContext to React components.
 */
export interface CookieConsentContextValue {
  /** Current consent state per category. */
  consents: ConsentState;

  /** Whether the CMP has been initialized and consent state is loaded. */
  isLoaded: boolean;

  /** Whether the user has already made a consent choice. */
  hasConsented: boolean;

  /** Grants consent for a specific category. */
  acceptCategory: (category: CookieCategory) => void;

  /** Revokes consent for a specific category. */
  revokeCategory: (category: CookieCategory) => void;

  /** Grants consent for all categories. */
  acceptAll: () => void;

  /** Revokes consent for all non-essential categories. */
  revokeAll: () => void;
}
