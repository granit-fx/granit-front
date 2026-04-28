import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { TimelineConfig } from '@granit/timeline';
import type { ReactNode } from 'react';

const TimelineConfigContext = createContext<TimelineConfig | null>(null);

/** Configuration for the timeline provider. */
export interface TimelineProviderConfig {
  readonly client?: AxiosInstance;
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
  const contextClient = useOptionalGranitClient();
  const value = useMemo<TimelineConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'TimelineProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
    };
  }, [config, contextClient]);

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
