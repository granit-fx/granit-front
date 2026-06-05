'use client';

import { defaultConsentState } from '@granit/cookies';
import { createLogger } from '@granit/logger';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { CookieConsentContextValue } from '../types/index';
import type { CookieCategory, CookieConsentAdapter, ConsentState } from '@granit/cookies';

const logger = createLogger('cookies');

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

interface CookieConsentProviderProps {
  /** The CMP adapter implementation (vanilla-cookieconsent, Klaro, etc.). */
  provider: CookieConsentAdapter;
  children: ReactNode;
}

/**
 * React context provider that initializes the CMP and exposes
 * consent state to the component tree.
 *
 * @example
 * ```tsx
 * <CookieConsentProvider provider={klaroProvider}>
 *   <App />
 * </CookieConsentProvider>
 * ```
 */
export function CookieConsentProvider({
  provider,
  children,
}: Readonly<CookieConsentProviderProps>) {
  const [consents, setConsents] = useState<ConsentState>(defaultConsentState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    provider
      .init()
      .then(() => {
        setConsents(provider.getConsents());
        setHasConsented(provider.hasConsented());
        setIsLoaded(true);
        unsubscribe = provider.onConsentChange((newConsents) => {
          setConsents(newConsents);
          setHasConsented(provider.hasConsented());
        });
      })
      .catch((err: unknown) => {
        logger.error('CMP initialization failed — keeping defaults', err);
        setIsLoaded(true);
      });

    return () => unsubscribe?.();
  }, [provider]);

  const acceptCategory = useCallback(
    (category: CookieCategory) => {
      provider.setConsent(category, true);
      setHasConsented(provider.hasConsented());
    },
    [provider]
  );

  const revokeCategory = useCallback(
    (category: CookieCategory) => {
      if (category === 'strictly_necessary') return;
      provider.setConsent(category, false);
      setHasConsented(provider.hasConsented());
    },
    [provider]
  );

  const acceptAll = useCallback(() => {
    provider.setAllConsents(true);
    setHasConsented(provider.hasConsented());
  }, [provider]);

  const revokeAll = useCallback(() => {
    provider.setAllConsents(false);
    setHasConsented(provider.hasConsented());
  }, [provider]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consents,
      isLoaded,
      hasConsented,
      acceptCategory,
      revokeCategory,
      acceptAll,
      revokeAll,
    }),
    [consents, isLoaded, hasConsented, acceptCategory, revokeCategory, acceptAll, revokeAll]
  );

  return <CookieConsentContext value={value}>{children}</CookieConsentContext>;
}
