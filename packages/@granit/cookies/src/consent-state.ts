import type { ConsentState } from './types/index';

/**
 * Returns the default consent state: only `strictly_necessary` is granted,
 * every optional category is denied until the user opts in.
 *
 * Single source of truth for the initial/fallback consent state — used by the
 * React provider and every CMP adapter so they stay in sync with the
 * {@link CookieCategory} union (e.g. when categories are added).
 */
export function defaultConsentState(): ConsentState {
  return {
    strictly_necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    saleorsharing: false,
  };
}
