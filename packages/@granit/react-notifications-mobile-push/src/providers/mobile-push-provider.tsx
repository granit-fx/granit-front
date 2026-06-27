import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig } from '@granit/react-api-client';
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

const { Provider, useConfig } = createConfigProvider<GranitProviderConfig>({
  name: 'MobilePush',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides mobile push configuration to child components and hooks. */
export const MobilePushProvider = Provider as (
  props: Readonly<MobilePushProviderProps>
) => ReactNode;

/** Returns the mobile push configuration from the nearest {@link MobilePushProvider}. */
export const useMobilePushConfig = useConfig as () => ResolvedMobilePushProviderConfig;

export type { MobilePlatform } from '@granit/notifications-mobile-push';
