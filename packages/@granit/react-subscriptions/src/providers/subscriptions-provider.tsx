import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the subscriptions provider. */
export interface SubscriptionsConfig extends GranitProviderConfig {
  /** Base path for subscriptions endpoints (default: `/api/v1/subscriptions`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export type ResolvedSubscriptionsConfig = ResolvedGranitProviderConfig<SubscriptionsConfig>;

export type SubscriptionsProviderProps = GranitProviderProps<SubscriptionsConfig>;

const { Provider, useConfig } = createConfigProvider<SubscriptionsConfig>({
  name: 'Subscriptions',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides subscriptions configuration to child components and hooks. */
export const SubscriptionsProvider = Provider;

/** Returns the subscriptions configuration from the nearest `SubscriptionsProvider`. */
export const useSubscriptionsConfig = useConfig;

/** Builds a consistent React Query key for subscriptions operations. */
export function buildSubscriptionsQueryKey(
  config: SubscriptionsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['subscriptions'];
  return [...prefix, ...segments];
}
