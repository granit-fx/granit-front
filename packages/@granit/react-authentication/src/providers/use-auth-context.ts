import * as React from 'react';

import type { BaseAuthContextType } from '@granit/authentication';

/**
 * Generic factory for a typed auth context.
 *
 * Each consuming app calls this once to create its own typed context
 * (extending BaseAuthContextType with app-specific fields).
 *
 * @example
 * interface AppAuthContext extends BaseAuthContextType { hasAdminRole: boolean }
 * export const { AuthContext, useAuth } = createAuthContext<AppAuthContext>();
 */
export function createAuthContext<T extends BaseAuthContextType>() {
  const AuthContext = React.createContext<T | undefined>(undefined);

  function useAuth(): T {
    const ctx = React.useContext(AuthContext);
    if (ctx === undefined) {
      throw new Error('useAuth must be used within an AuthContext.Provider');
    }
    return ctx;
  }

  return { AuthContext, useAuth };
}
