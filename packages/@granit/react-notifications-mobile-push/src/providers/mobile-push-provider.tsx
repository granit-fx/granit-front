import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Resolved configuration exposed by {@link useMobilePushConfig}. */
export interface MobilePushProviderConfig {
  readonly client?: AxiosInstance;
  readonly basePath: string;
}

/**
 * MobilePushProviderConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedMobilePushProviderConfig extends MobilePushProviderConfig {
  readonly client: AxiosInstance;
}

/** Props accepted by {@link MobilePushProvider}. `basePath` is optional — the default is applied by the provider. */
export interface MobilePushProviderProps {
  readonly config: Omit<MobilePushProviderConfig, 'basePath'> &
    Partial<Pick<MobilePushProviderConfig, 'basePath'>>;
  readonly children: ReactNode;
}

const MobilePushConfigContext = createContext<ResolvedMobilePushProviderConfig | null>(null);

/** Provides mobile push configuration to child components and hooks. */
export function MobilePushProvider({ config, children }: Readonly<MobilePushProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'MobilePushProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <MobilePushConfigContext value={value}>{children}</MobilePushConfigContext>;
}

/** Returns the mobile push configuration from the nearest {@link MobilePushProvider}. */
export function useMobilePushConfig(): ResolvedMobilePushProviderConfig {
  const ctx = useContext(MobilePushConfigContext);
  if (!ctx) {
    throw new Error('useMobilePushConfig must be used within a MobilePushProvider');
  }
  return ctx;
}

export type { MobilePlatform } from '@granit/notifications-mobile-push';
