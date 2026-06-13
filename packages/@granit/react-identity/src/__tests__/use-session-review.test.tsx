import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSessionReviewContext, useSubmitSessionReview } from '../hooks/use-session-review';
import { IdentityProvider } from '../providers/identity-provider';

import type { IdentityProviderProps } from '../providers/identity-provider';
import type { SessionReviewContextResponse, SessionReviewResultResponse } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    const config: IdentityProviderProps['config'] = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

describe('use-session-review', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSessionReviewContext', () => {
    it('should GET the review context for the token at /api/v1/sessions/review', async () => {
      const client = createMockClient();
      const context: SessionReviewContextResponse = { country: 'Belgium', decision: null };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(context));

      const { result } = renderHook(() => useSessionReviewContext('tok-123'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/sessions/review', {
        params: { token: 'tok-123' },
      });
      expect(result.current.data).toEqual(context);
    });

    it('should stay disabled (no request) when no token is provided', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useSessionReviewContext(null), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });

    it('should surface a 400 (invalid/expired token) as an error without retrying', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockRejectedValue({
        isAxiosError: true,
        response: { status: 400 },
      });

      const { result } = renderHook(() => useSessionReviewContext('bad-token'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(client.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('useSubmitSessionReview', () => {
    it('should POST the decision and prime the cached context with the outcome', async () => {
      const client = createMockClient();
      const outcome: SessionReviewResultResponse = { decision: 'Denied', applied: true };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(outcome));

      const { result } = renderHook(() => useSubmitSessionReview(), {
        wrapper: createWrapper(client),
      });

      const returned = await result.current.mutateAsync({ token: 'tok-123', decision: 'Denied' });

      expect(client.post).toHaveBeenCalledWith('/api/v1/sessions/review', {
        token: 'tok-123',
        decision: 'Denied',
      });
      expect(returned).toEqual(outcome);
    });
  });
});
