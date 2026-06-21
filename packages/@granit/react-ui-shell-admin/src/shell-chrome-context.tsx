import { createContext, useContext, type ReactNode } from 'react';

import type { LanguageInfo } from '@granit/localization';
import type { NavGroup, NavItem } from '@granit/shell-core';

/** The signed-in user, as the chrome's user menu needs it. */
export interface ShellChromeUser {
  sub: string;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface ShellChromeLogger {
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * App-specific data the admin chrome needs, injected by the host app so the
 * chrome components stay decoupled from how the app resolves auth, builds its
 * navigation, lists languages or logs. Provide it with `ShellChromeProvider`
 * around the `AppShell`.
 */
export interface ShellChromeValue {
  /** Host vs tenant app — drives workspace-query options and a few branches. */
  appKind: 'host' | 'tenant';
  /** Static navigation model (used when no workspace-driven nav is active). */
  navModel: { mainNavigation: NavItem[]; navGroups: NavGroup[] };
  user: ShellChromeUser | undefined;
  logout: () => void;
  /** True while an admin is impersonating another user (drives the banner/menu). */
  isImpersonating: boolean;
  /** Available UI languages for the language switcher. */
  languages: LanguageInfo[];
  logger: ShellChromeLogger;
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
