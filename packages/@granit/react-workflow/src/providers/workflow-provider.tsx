import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { WorkflowConfig } from '@granit/workflow';
import type { AxiosInstance } from 'axios';

const WorkflowConfigContext = createContext<WorkflowConfig | null>(null);

export interface WorkflowProviderProps {
  apiClient: AxiosInstance;
  basePath?: string;
  children: React.ReactNode;
}

export function WorkflowProvider({
  apiClient,
  basePath = DEFAULT_BASE_PATH,
  children,
}: Readonly<WorkflowProviderProps>) {
  const config = useMemo<WorkflowConfig>(() => ({ apiClient, basePath }), [apiClient, basePath]);

  return <WorkflowConfigContext.Provider value={config}>{children}</WorkflowConfigContext.Provider>;
}

export function useWorkflowConfig(): WorkflowConfig {
  const config = useContext(WorkflowConfigContext);
  if (!config) {
    throw new Error('useWorkflowConfig must be used within a <WorkflowProvider>');
  }
  return config;
}
