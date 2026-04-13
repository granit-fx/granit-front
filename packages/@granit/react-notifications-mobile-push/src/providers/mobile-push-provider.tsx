import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { MobilePlatform } from '@granit/notifications-mobile-push';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Resolved configuration exposed by {@link useMobilePushConfig}. */
export interface MobilePushProviderConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

/** Props accepted by {@link MobilePushProvider}. `basePath` is optional — the default is applied by the provider. */
export interface MobilePushProviderProps {
  readonly config: Omit<MobilePushProviderConfig, 'basePath'> &
    Partial<Pick<MobilePushProviderConfig, 'basePath'>>;
  readonly children: ReactNode;
}

const MobilePushConfigContext = createContext<MobilePushProviderConfig | null>(null);

/** Provides mobile push configuration to child components and hooks. */
export function MobilePushProvider({ config, children }: Readonly<MobilePushProviderProps>) {
  const value = useMemo<MobilePushProviderConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    }),
    [config],
  );
  return <MobilePushConfigContext value={value}>{children}</MobilePushConfigContext>;
}

/** Returns the mobile push configuration from the nearest {@link MobilePushProvider}. */
export function useMobilePushConfig(): MobilePushProviderConfig {
  const ctx = useContext(MobilePushConfigContext);
  if (!ctx) {
    throw new Error('useMobilePushConfig must be used within a MobilePushProvider');
  }
  return ctx;
}

export type { MobilePlatform };
