import { createContext, type ComponentType, useContext, type ReactNode } from 'react';

import type { NavGroup, NavItem } from '@granit/shell-core';

/** A nav icon as the chrome renders it: a component taking an optional className. */
export type ShellNavIcon = ComponentType<{ className?: string }>;
/** The navigation model the chrome consumes (icons are renderable components). */
export type ShellNavItem = NavItem<ShellNavIcon, string>;
export type ShellNavGroup = NavGroup<ShellNavIcon, string>;

/**
 * App-specific data the admin chrome needs, injected by the host app so the
 * chrome components stay decoupled from how the app builds its navigation.
 * Provide it with `ShellChromeProvider` around the `AppShell`.
 *
 * Note: app-flavoured composition (the user menu, header widgets, feature
 * mounts) is NOT injected here — it's passed as slots/children, so each app
 * keeps its own auth/routes/menu without this context ballooning.
 */
export interface ShellChromeValue {
  /** Host vs tenant app — drives workspace-query options and a few branches. */
  appKind: 'host' | 'tenant';
  /** Static navigation model (used when no workspace-driven nav is active). */
  navModel: { mainNavigation: ShellNavItem[]; navGroups: ShellNavGroup[] };
  /** App version shown in the sidebar footer (optional). */
  appVersion?: string;
}

const ShellChromeContext = createContext<ShellChromeValue | null>(null);

export interface ShellChromeProviderProps {
  readonly value: ShellChromeValue;
  readonly children: ReactNode;
}

export function ShellChromeProvider({ value, children }: ShellChromeProviderProps) {
  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
}

export function useShellChrome(): ShellChromeValue {
  const ctx = useContext(ShellChromeContext);
  if (!ctx) throw new Error('useShellChrome must be used within a <ShellChromeProvider>');
  return ctx;
}
