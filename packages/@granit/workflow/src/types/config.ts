import type { AxiosInstance } from '@granit/api-client';

/** Configuration for the workflow provider context. */
export interface WorkflowConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}
