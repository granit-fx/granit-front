import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { AxiosInstance } from '@granit/api-client';

export interface ValidationConfig {
  readonly client: AxiosInstance;
  readonly basePath?: string;
}

const ValidationContext = createContext<ValidationConfig | null>(null);

interface ValidationProviderProps extends ValidationConfig {
  readonly children: ReactNode;
}

/**
 * Provides a shared Axios client and optional base path to all validation hooks
 * in the subtree, eliminating per-call client/basePath wiring.
 *
 * @example
 * ```tsx
 * <ValidationProvider client={axiosInstance} basePath="/api/v1/validation">
 *   <MyForm />
 * </ValidationProvider>
 * ```
 */
export function ValidationProvider({ client, basePath, children }: ValidationProviderProps) {
  const value = useMemo(() => ({ client, basePath }), [client, basePath]);
  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>;
}

/**
 * Returns the nearest {@link ValidationProvider}'s config.
 * Throws when used outside a provider.
 */
export function useValidationConfig(): ValidationConfig {
  const config = useContext(ValidationContext);
  if (!config) {
    throw new Error(
      '[@granit/react-validation] useValidationConfig must be used within a ValidationProvider.'
    );
  }
  return config;
}
