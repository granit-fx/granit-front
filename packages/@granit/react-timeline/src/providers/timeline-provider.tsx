import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants.js';

import type { TimelineConfig } from '@granit/timeline';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const TimelineConfigContext = createContext<TimelineConfig | null>(null);

/** Configuration for the timeline provider. */
export interface TimelineProviderConfig {
  readonly client: AxiosInstance;
  /** Base path for timeline endpoints (default: `/api/v1/timeline`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface TimelineProviderProps {
  readonly config: TimelineProviderConfig;
  readonly children: ReactNode;
}

/** Provides timeline configuration to child components and hooks. */
export function TimelineProvider({ config, children }: Readonly<TimelineProviderProps>) {
  const value = useMemo<TimelineConfig>(() => ({
    ...config,
    basePath: config.basePath ?? DEFAULT_BASE_PATH,
    queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
  }), [config]);

  return <TimelineConfigContext value={value}>{children}</TimelineConfigContext>;
}

/** Returns the timeline configuration from the nearest `TimelineProvider`. */
export function useTimelineConfig(): TimelineConfig {
  const config = useContext(TimelineConfigContext);
  if (!config) {
    throw new Error('useTimelineConfig must be used within a <TimelineProvider>');
  }
  return config;
}

/** Builds a consistent React Query key for timeline operations. */
export function buildTimelineQueryKey(
  config: TimelineConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX;
  return [...prefix, ...segments];
}
