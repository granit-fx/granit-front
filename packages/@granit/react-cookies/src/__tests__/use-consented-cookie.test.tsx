import { defaultConsentState } from '@granit/cookies';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useConsentedCookie } from '../hooks/use-consented-cookie';
import { CookieConsentProvider } from '../providers/cookie-consent-provider';

import type { CookieCategory, CookieConsentAdapter, ConsentState } from '@granit/cookies';
import type { ReactNode } from 'react';

function createMockProvider(consents: Partial<ConsentState> = {}): CookieConsentAdapter {
  const state: ConsentState = { ...defaultConsentState(), ...consents };
  let changeCallback: ((consents: ConsentState) => void) | undefined;

  return {
    init: vi.fn().mockResolvedValue(undefined),
    getConsents: vi.fn().mockReturnValue(state),
    onConsentChange: vi.fn().mockImplementation((cb) => {
      changeCallback = cb;
      return () => {
        changeCallback = undefined;
      };
    }),
    setConsent: vi.fn().mockImplementation((category: CookieCategory, granted: boolean) => {
      state[category] = granted;
      changeCallback?.(structuredClone(state));
    }),
    setAllConsents: vi.fn(),
    hasConsented: vi.fn().mockReturnValue(true),
  };
}

function createWrapper(provider: CookieConsentAdapter) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <CookieConsentProvider provider={provider}>{children}</CookieConsentProvider>;
  };
}

function clearAllCookies(): void {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

afterEach(clearAllCookies);

describe('useConsentedCookie', () => {
  it('writes a strictly_necessary cookie even before consent is loaded', () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useConsentedCookie('session', 'strictly_necessary'), {
      wrapper: createWrapper(provider),
    });

    expect(result.current.isAllowed).toBe(true);
    let written = false;
    act(() => {
      written = result.current.set('abc');
    });

    expect(written).toBe(true);
    expect(result.current.get()).toBe('abc');
  });

  it('blocks writes until the category is granted', async () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useConsentedCookie('analytics_id', 'analytics'), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isAllowed).toBe(false);
    });

    act(() => {
      result.current.set('xyz');
    });
    expect(result.current.get()).toBeNull();
  });

  it('allows writes once consent is granted at runtime', async () => {
    const provider = createMockProvider();

    const { result } = renderHook(
      () => {
        const consent = useConsentedCookie('analytics_id', 'analytics');
        return consent;
      },
      { wrapper: createWrapper(provider) }
    );

    // Grant analytics through the provider and wait for the context to update.
    act(() => {
      provider.setConsent('analytics', true);
    });

    await vi.waitFor(() => {
      expect(result.current.isAllowed).toBe(true);
    });

    let written = false;
    act(() => {
      written = result.current.set('xyz');
    });

    expect(written).toBe(true);
    expect(result.current.get()).toBe('xyz');
  });

  it('removes a cookie', () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useConsentedCookie('tmp', 'strictly_necessary'), {
      wrapper: createWrapper(provider),
    });

    act(() => {
      result.current.set('1');
    });
    expect(result.current.get()).toBe('1');

    act(() => {
      result.current.remove();
    });
    expect(result.current.get()).toBeNull();
  });
});
