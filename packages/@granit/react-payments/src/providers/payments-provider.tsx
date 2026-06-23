import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/**
 * App-supplied resolvers for official, licensed brand logos. The framework
 * never ships protected brand artwork (see `ProviderIcon`/`PaymentMethodIcon`,
 * which render trademark-safe generic badges); an application that has obtained
 * the relevant licenses provides its own SVGs through these resolvers. A
 * resolver returns the logo node for a known identifier, or `undefined` to let
 * the icon fall back to the generic badge.
 */
export interface PaymentBrandIconResolvers {
  /** Resolve a provider logo (e.g. `stripe`, `mollie`) or `undefined`. */
  readonly provider?: (providerName: string) => ReactNode | undefined;
  /** Resolve a method logo (e.g. `bancontact`, `ideal`) or `undefined`. */
  readonly method?: (methodType: string) => ReactNode | undefined;
}

/** Configuration for the payments provider. */
export interface PaymentsConfig {
  readonly client?: AxiosInstance;
  /** Base path for payment endpoints (default: `/api/v1/payments`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
  /**
   * Optional licensed brand-logo resolvers. When omitted, every icon renders
   * the generic trademark-safe badge.
   */
  readonly brandIcons?: PaymentBrandIconResolvers;
}

/**
 * PaymentsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedPaymentsConfig extends PaymentsConfig {
  readonly client: AxiosInstance;
}

export interface PaymentsProviderProps {
  readonly config: PaymentsConfig;
  readonly children: ReactNode;
}

const PaymentsConfigContext = createContext<ResolvedPaymentsConfig | null>(null);

/** Provides payments configuration to child components and hooks. */
export function PaymentsProvider({ config, children }: Readonly<PaymentsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedPaymentsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'PaymentsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <PaymentsConfigContext value={value}>{children}</PaymentsConfigContext>;
}

/** Returns the payments configuration from the nearest `PaymentsProvider`. */
export function usePaymentsConfig(): ResolvedPaymentsConfig {
  const ctx = useContext(PaymentsConfigContext);
  if (!ctx) {
    throw new Error('usePaymentsConfig must be used within a PaymentsProvider');
  }
  return ctx;
}

/**
 * Like `usePaymentsConfig`, but returns `null` instead of throwing when no
 * `PaymentsProvider` is mounted. Lets shared primitives (e.g. the icons) read
 * optional config — such as `brandIcons` — while staying usable standalone.
 */
export function useOptionalPaymentsConfig(): ResolvedPaymentsConfig | null {
  return useContext(PaymentsConfigContext);
}

/** Builds a consistent React Query key for payments operations. */
export function buildPaymentsQueryKey(
  config: PaymentsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['payments'];
  return [...prefix, ...segments];
}
