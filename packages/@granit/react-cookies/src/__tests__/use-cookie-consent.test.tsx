import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCookieConsent } from '../hooks/use-cookie-consent';
import { CookieConsentProvider } from '../providers/cookie-consent-provider';

import type {
  CookieCategory,
  CookieConsentProvider as ICookieConsentProvider,
  ConsentState,
} from '@granit/cookies';
import type { ReactNode } from 'react';

function createMockProvider(
  consents: Partial<ConsentState> = {},
  consented = false
): ICookieConsentProvider {
  const state: ConsentState = {
    strictly_necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
    ...consents,
  };

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
    setAllConsents: vi.fn().mockImplementation((granted) => {
      state.preferences = granted;
      state.analytics = granted;
      state.marketing = granted;
      changeCallback?.(structuredClone(state));
    }),
    hasConsented: vi.fn().mockReturnValue(consented),
  };
}

function createWrapper(provider: ICookieConsentProvider) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <CookieConsentProvider provider={provider}>{children}</CookieConsentProvider>;
  };
}

describe('useCookieConsent', () => {
  it('should throw when used outside CookieConsentProvider', () => {
    expect(() => renderHook(() => useCookieConsent())).toThrow(
      'useCookieConsent must be used within a CookieConsentProvider'
    );
  });

  it('should return default consents before initialization', () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    expect(result.current.consents.strictly_necessary).toBe(true);
    expect(result.current.consents.analytics).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.hasConsented).toBe(false);
  });

  it('should call provider.init on mount', () => {
    const provider = createMockProvider();

    renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    expect(provider.init).toHaveBeenCalledOnce();
  });

  it('should load consents after initialization', async () => {
    const provider = createMockProvider({ analytics: true }, true);

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.consents.analytics).toBe(true);
    expect(result.current.hasConsented).toBe(true);
    expect(provider.getConsents).toHaveBeenCalled();
    expect(provider.onConsentChange).toHaveBeenCalled();
  });

  it('should delegate acceptCategory to provider.setConsent', async () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.acceptCategory('analytics');
    });

    expect(provider.setConsent).toHaveBeenCalledWith('analytics', true);
    expect(result.current.consents.analytics).toBe(true);
  });

  it('should delegate revokeCategory to provider.setConsent', async () => {
    const provider = createMockProvider({ preferences: true });

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.revokeCategory('preferences');
    });

    expect(provider.setConsent).toHaveBeenCalledWith('preferences', false);
    expect(result.current.consents.preferences).toBe(false);
  });

  it('should ignore strictly_necessary on revokeCategory', async () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.revokeCategory('strictly_necessary');
    });

    expect(provider.setConsent).not.toHaveBeenCalled();
    expect(result.current.consents.strictly_necessary).toBe(true);
  });

  it('should delegate acceptAll to provider.setAllConsents', async () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.acceptAll();
    });

    expect(provider.setAllConsents).toHaveBeenCalledWith(true);
    expect(result.current.consents).toEqual({
      strictly_necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
  });

  it('should delegate revokeAll to provider.setAllConsents', async () => {
    const provider = createMockProvider({
      preferences: true,
      analytics: true,
      marketing: true,
    });

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.revokeAll();
    });

    expect(provider.setAllConsents).toHaveBeenCalledWith(false);
    expect(result.current.consents).toEqual({
      strictly_necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
  });

  it('should expose hasConsented as false when user has not consented yet', async () => {
    const provider = createMockProvider({}, false);

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await vi.waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.hasConsented).toBe(false);
  });
});
