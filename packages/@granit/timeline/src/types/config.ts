import type { AxiosInstance } from 'axios';

// --- Provider config ---

export interface TimelineConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}
