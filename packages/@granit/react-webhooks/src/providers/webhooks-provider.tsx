import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_WEBHOOKS_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the webhooks provider. */
export interface WebhooksConfig extends GranitProviderConfig {
  /**
   * Base path for webhooks endpoints (default: `/api/v1/webhooks`).
   *
   * The subscription resource lives at `${basePath}/subscriptions`; deliveries,
   * event types, config and stats live directly under `${basePath}`.
   */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export type ResolvedWebhooksConfig = ResolvedGranitProviderConfig<WebhooksConfig>;

export type WebhooksProviderProps = GranitProviderProps<WebhooksConfig>;

const { Provider, useConfig } = createConfigProvider<WebhooksConfig>({
  name: 'Webhooks',
  defaultBasePath: DEFAULT_WEBHOOKS_BASE_PATH,
});

/** Provides webhooks configuration to child components and hooks. */
export const WebhooksProvider = Provider;

/** Returns the webhooks configuration from the nearest `WebhooksProvider`. */
export const useWebhooksConfig = useConfig;
