import type { AxiosInstance } from '@granit/api-client';

// --- Provider config ---

export interface TimelineConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}
