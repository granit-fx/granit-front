import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';
import type { TimelineConfig } from '@granit/timeline';

/** Configuration for the timeline provider. */
export interface TimelineProviderConfig extends GranitProviderConfig {
  /** Base path for timeline endpoints (default: `/api/v1/timeline`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export type TimelineProviderProps = GranitProviderProps<TimelineProviderConfig>;

const { Provider, useConfig } = createConfigProvider<TimelineProviderConfig, TimelineConfig>({
  name: 'Timeline',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
  }),
});

/** Provides timeline configuration to child components and hooks. */
export const TimelineProvider = Provider;

/** Returns the timeline configuration from the nearest `TimelineProvider`. */
export const useTimelineConfig = useConfig;

/** Builds a consistent React Query key for timeline operations. */
export function buildTimelineQueryKey(
  config: TimelineConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX;
  return [...prefix, ...segments];
}
