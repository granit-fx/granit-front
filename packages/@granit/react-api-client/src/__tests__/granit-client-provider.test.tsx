import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

import {
  GranitClientProvider,
  useGranitClient,
  useOptionalGranitClient,
} from '../providers/granit-client-provider.js';

import type { ReactNode } from 'react';

function wrapper(client: ReturnType<typeof axios.create>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <GranitClientProvider client={client}>{children}</GranitClientProvider>
    );
  };
}

describe('GranitClientProvider', () => {
  describe('useGranitClient', () => {
    it('returns the provided client instance', () => {
      const client = axios.create();
      const { result } = renderHook(() => useGranitClient(), {
        wrapper: wrapper(client),
      });
      expect(result.current).toBe(client);
    });

    it('throws when used outside provider', () => {
      expect(() => {
        renderHook(() => useGranitClient());
      }).toThrow('useGranitClient must be used within a <GranitClientProvider>');
    });
  });

  describe('useOptionalGranitClient', () => {
    it('returns the provided client instance', () => {
      const client = axios.create();
      const { result } = renderHook(() => useOptionalGranitClient(), {
        wrapper: wrapper(client),
      });
      expect(result.current).toBe(client);
    });

    it('returns null when used outside provider', () => {
      const { result } = renderHook(() => useOptionalGranitClient());
      expect(result.current).toBeNull();
    });
  });
});
