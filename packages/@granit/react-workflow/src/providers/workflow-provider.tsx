import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the workflow provider. */
export interface WorkflowConfig extends GranitProviderConfig {
  /** Base path for workflow endpoints (default: `/api/v1/workflow`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export type ResolvedWorkflowConfig = ResolvedGranitProviderConfig<WorkflowConfig>;

export type WorkflowProviderProps = GranitProviderProps<WorkflowConfig>;

const { Provider, useConfig } = createConfigProvider<WorkflowConfig>({
  name: 'Workflow',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides workflow configuration to child components and hooks. */
export const WorkflowProvider = Provider;

/** Returns the workflow configuration from the nearest `WorkflowProvider`. */
export const useWorkflowConfig = useConfig;
