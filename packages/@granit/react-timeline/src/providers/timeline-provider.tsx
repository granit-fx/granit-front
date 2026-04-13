import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { TimelineConfig } from '@granit/timeline';
import type { AxiosInstance } from 'axios';

const TimelineConfigContext = createContext<TimelineConfig | null>(null);

export interface TimelineProviderProps {
  apiClient: AxiosInstance;
  basePath?: string;
  children: React.ReactNode;
}

export function TimelineProvider({
  apiClient,
  basePath = DEFAULT_BASE_PATH,
  children,
}: Readonly<TimelineProviderProps>) {
  const config = useMemo<TimelineConfig>(() => ({ apiClient, basePath }), [apiClient, basePath]);

  return <TimelineConfigContext.Provider value={config}>{children}</TimelineConfigContext.Provider>;
}

export function useTimelineConfig(): TimelineConfig {
  const config = useContext(TimelineConfigContext);
  if (!config) {
    throw new Error('useTimelineConfig must be used within a <TimelineProvider>');
  }
  return config;
}
