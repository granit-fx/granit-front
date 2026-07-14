import { defaultConsentState } from '@granit/cookies';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCookieConsent } from '../hooks/use-cookie-consent';
import { CookieConsentProvider } from '../providers/cookie-consent-provider';

import type { CookieCategory, CookieConsentAdapter, ConsentState } from '@granit/cookies';
import type { ReactNode } from 'react';

function createMockProvider(): CookieConsentAdapter {
  const state: ConsentState = defaultConsentState();
  let changeCallback: ((consents: ConsentState) => void) | undefined;

  return {
    init: vi.fn().mockResolvedValue(undefined),
    getConsents: vi.fn().mockReturnValue(state),
    onConsentChange: vi.fn().mockImplementation((cb: (c: ConsentState) => void) => {
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

function createWrapper(
  provider: CookieConsentAdapter,
  recordConsent?: (consents: ConsentState) => void | Promise<void>
) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <CookieConsentProvider provider={provider} recordConsent={recordConsent}>
        {children}
      </CookieConsentProvider>
    );
  };
}

describe('CookieConsentProvider — recordConsent', () => {
  it('forwards each post-init decision with the resulting consent state', async () => {
    const provider = createMockProvider();
    const recordConsent = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider, recordConsent),
    });

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // No decision recorded from the initial load — only genuine changes.
    expect(recordConsent).not.toHaveBeenCalled();

    act(() => {
      result.current.acceptCategory('analytics');
    });

    expect(recordConsent).toHaveBeenCalledTimes(1);
    expect(recordConsent).toHaveBeenCalledWith(
      expect.objectContaining({ analytics: true, strictly_necessary: true })
    );
  });

  it('swallows a rejected recordConsent so the consent flow never breaks', async () => {
    const provider = createMockProvider();
    const recordConsent = vi.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider, recordConsent),
    });

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(() => {
      act(() => {
        result.current.acceptCategory('marketing');
      });
    }).not.toThrow();

    expect(result.current.consents.marketing).toBe(true);
  });

  it('works without a recordConsent prop', async () => {
    const provider = createMockProvider();

    const { result } = renderHook(() => useCookieConsent(), {
      wrapper: createWrapper(provider),
    });

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(() => {
      act(() => {
        result.current.acceptCategory('analytics');
      });
    }).not.toThrow();
  });
});
