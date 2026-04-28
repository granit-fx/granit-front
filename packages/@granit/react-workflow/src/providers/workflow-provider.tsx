import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the workflow provider. */
export interface WorkflowConfig {
  readonly client?: AxiosInstance;
  /** Base path for workflow endpoints (default: `/api/v1/workflow`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedWorkflowConfig extends WorkflowConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface WorkflowProviderProps {
  readonly config: WorkflowConfig;
  readonly children: ReactNode;
}

const WorkflowConfigContext = createContext<ResolvedWorkflowConfig | null>(null);

/** Provides workflow configuration to child components and hooks. */
export function WorkflowProvider({ config, children }: Readonly<WorkflowProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedWorkflowConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'WorkflowProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_BASE_PATH };
  }, [config, contextClient]);
  return <WorkflowConfigContext value={value}>{children}</WorkflowConfigContext>;
}

/** Returns the workflow configuration from the nearest `WorkflowProvider`. */
export function useWorkflowConfig(): ResolvedWorkflowConfig {
  const ctx = useContext(WorkflowConfigContext);
  if (!ctx) {
    throw new Error('useWorkflowConfig must be used within a <WorkflowProvider>');
  }
  return ctx;
}

/** Builds a consistent React Query key for workflow operations. */
export function buildWorkflowQueryKey(
  config: WorkflowConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['workflow'];
  return [...prefix, ...segments];
}
