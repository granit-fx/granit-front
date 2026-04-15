import { createContext, useContext } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const GranitClientContext = createContext<AxiosInstance | null>(null);

export interface GranitClientProviderProps {
  /** Axios instance shared across all Granit framework providers and hooks. */
  readonly client: AxiosInstance;
  readonly children: ReactNode;
}

/**
 * Provides a shared Axios instance to all Granit framework providers and hooks.
 *
 * Place this at the root of your application so that domain providers
 * (`QueryProvider`, `DataExchangeProvider`, etc.) can resolve the client
 * from context instead of requiring it in every config object.
 *
 * @example
 * ```tsx
 * import { createApiClient } from '@granit/api-client';
 *
 * const api = createApiClient({ baseURL: '/api' });
 *
 * <GranitClientProvider client={api}>
 *   <App />
 * </GranitClientProvider>
 * ```
 */
export function GranitClientProvider({ client, children }: GranitClientProviderProps) {
  return <GranitClientContext value={client}>{children}</GranitClientContext>;
}

/**
 * Returns the Axios instance from the nearest `GranitClientProvider`.
 *
 * Throws if no provider is found. Use this in application code where the
 * provider is guaranteed to exist.
 */
export function useGranitClient(): AxiosInstance {
  const client = useContext(GranitClientContext);
  if (!client) {
    throw new Error('useGranitClient must be used within a <GranitClientProvider>');
  }
  return client;
}

/**
 * Returns the Axios instance from the nearest `GranitClientProvider`,
 * or `null` if no provider is found.
 *
 * Intended for use inside other Granit framework packages to implement
 * the `config.client ?? context` fallback pattern.
 */
export function useOptionalGranitClient(): AxiosInstance | null {
  return useContext(GranitClientContext);
}
