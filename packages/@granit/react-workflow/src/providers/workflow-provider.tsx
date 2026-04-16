import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the workflow provider. */
export interface WorkflowConfig {
  readonly client: AxiosInstance;
  /** Base path for workflow endpoints (default: `/api/v1/workflow`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedWorkflowConfig extends WorkflowConfig {
  readonly basePath: string;
}

export interface WorkflowProviderProps {
  readonly config: WorkflowConfig;
  readonly children: ReactNode;
}

const WorkflowConfigContext = createContext<ResolvedWorkflowConfig | null>(null);

/** Provides workflow configuration to child components and hooks. */
export function WorkflowProvider({ config, children }: Readonly<WorkflowProviderProps>) {
  const value = useMemo<ResolvedWorkflowConfig>(
    () => ({ ...config, basePath: config.basePath ?? DEFAULT_BASE_PATH }),
    [config],
  );
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
