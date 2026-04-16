import type { AxiosInstance } from 'axios';

/** Configuration for the workflow provider context. */
export interface WorkflowConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}
