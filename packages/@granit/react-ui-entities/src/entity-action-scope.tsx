/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// Host-side scope captured by `<WorkspaceEntityPage>` whenever a list
// view is mounted. The framework's `EntityActionOverlayState` (carried
// through `<EntityActionDrawerHost>` / `<EntityActionModalHost>`) only
// holds the action + rowId, so the action overlay components mounted at
// the App shell read the active entity name from this parallel context
// to know which manifest to render in the drawer / modal body.

interface EntityActionScopeValue {
  readonly entityName: string | null;
  readonly setEntityName: (next: string | null) => void;
}

const EntityActionScopeContext = createContext<EntityActionScopeValue | null>(null);

export function EntityActionScopeProvider({ children }: { readonly children: ReactNode }) {
  const [entityName, setEntityName] = useState<string | null>(null);
  const value = useMemo<EntityActionScopeValue>(
    () => ({ entityName, setEntityName }),
    [entityName]
  );
  return (
    <EntityActionScopeContext.Provider value={value}>{children}</EntityActionScopeContext.Provider>
  );
}

export function useEntityActionScope(): EntityActionScopeValue {
  const ctx = useContext(EntityActionScopeContext);
  if (!ctx) {
    throw new Error('useEntityActionScope must be used within <EntityActionScopeProvider>');
  }
  return ctx;
}
