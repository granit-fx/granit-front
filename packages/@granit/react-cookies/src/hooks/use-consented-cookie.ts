'use client';

import { getCookie, removeCookie, setConsentedCookie } from '@granit/cookies';
import { useMemo } from 'react';

import { useCookieConsent } from './use-cookie-consent';

import type { CookieAttributes, CookieCategory } from '@granit/cookies';

/**
 * Consent-aware accessor for a single cookie, returned by {@link useConsentedCookie}.
 */
export interface ConsentedCookie {
  /** Read the current value, or `null` if absent. */
  get(): string | null;
  /**
   * Write the cookie — only succeeds when the bound category is granted.
   * @returns `true` if written, `false` if consent is missing.
   */
  set(value: string, attributes?: CookieAttributes): boolean;
  /** Delete the cookie. Pass the same `path`/`domain` used to write it. */
  remove(attributes?: Omit<CookieAttributes, 'maxAge' | 'expires'>): void;
  /** Whether the bound category is currently granted (i.e. `set` would write). */
  readonly isAllowed: boolean;
}

/**
 * Hook returning a consent-gated accessor for a named cookie. Reads the live
 * consent state from {@link useCookieConsent}, so `set` writes only when the
 * `category` is granted and `isAllowed` reflects the current state.
 *
 * Must be used within a `CookieConsentProvider`.
 *
 * @example
 * ```tsx
 * const prefs = useConsentedCookie('ui_prefs', 'preferences');
 *
 * if (prefs.isAllowed) prefs.set(JSON.stringify(state), { maxAge: 31_536_000 });
 * const raw = prefs.get();
 * ```
 */
export function useConsentedCookie(name: string, category: CookieCategory): ConsentedCookie {
  const { consents } = useCookieConsent();
  const isAllowed = category === 'strictly_necessary' || consents[category] === true;

  return useMemo<ConsentedCookie>(
    () => ({
      isAllowed,
      get: () => getCookie(name),
      set: (value, attributes) =>
        setConsentedCookie(name, value, { ...attributes, category, consents }),
      remove: (attributes) => removeCookie(name, attributes),
    }),
    [name, category, consents, isAllowed]
  );
}
