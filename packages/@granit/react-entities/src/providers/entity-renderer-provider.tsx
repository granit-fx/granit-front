import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { EMPTY_COMPONENT_CATALOG, type EntityComponentCatalog } from './component-catalog';

import type { Logger } from '@granit/logger';

/**
 * Resolves an i18n key (as carried by the manifest) into a localised
 * string. Apps wire react-i18next or their own resolver here so the
 * renderers stay framework-agnostic.
 */
export type ResolveLabel = (key: string, fallback?: string) => string;

const defaultResolveLabel: ResolveLabel = (key, fallback) => fallback ?? key;

/** Context value carried by `<EntityRendererProvider>`. */
export interface EntityRendererContextValue {
  readonly components: EntityComponentCatalog;
  readonly resolveLabel: ResolveLabel;
  /**
   * Logger used by built-in dispatchers and selection bars to report action
   * failures. When omitted, falls back to a `console`-backed shim so errors
   * surface during development; production apps should always wire a
   * redacting logger from `@granit/logger`.
   */
  readonly logger: Logger;
}

const consoleLogger: Logger = {
  debug: (message, context) => globalThis.console.debug(message, context),
  info: (message, context) => globalThis.console.info(message, context),
  warn: (message, context) => globalThis.console.warn(message, context),
  error: (message, error, context) => globalThis.console.error(message, error, context),
  // The shim is a leaf — `child(prefix)` returns the same instance so apps
  // wiring `useEntityRendererLogger().child('…')` outside a provider don't
  // crash. Real namespacing kicks in once a `@granit/logger` Logger is
  // wired via `<EntityRendererProvider logger={…}>`.
  child: () => consoleLogger,
};

const EntityRendererContext = createContext<EntityRendererContextValue | null>(null);

export interface EntityRendererProviderProps {
  /** Component catalog. Defaults to an empty catalog (renderers will fall back to a generic component when one isn't registered). */
  readonly components?: EntityComponentCatalog;
  /** i18n bridge. Default returns `fallback ?? key` so the UI shows the key while the app wires translations. */
  readonly resolveLabel?: ResolveLabel;
  /**
   * Logger from `@granit/logger`. Defaults to a `console`-backed shim — wire
   * a redacting logger in production to avoid leaking action payloads or
   * error details into the browser console.
   */
  readonly logger?: Logger;
  readonly children: ReactNode;
}

/**
 * Carries the component catalog + i18n bridge consumed by `<EntityForm />`,
 * `<EntityDetail />`, `<EntityList />`, `<EntityKanban />`. The provider
 * is intentionally lean — i18n / theming / layout primitives stay in the
 * host app's concern, and renderers ask for the two things they cannot
 * resolve themselves: which React component to mount for `field.component`,
 * and how to translate a manifest label key.
 */
export function EntityRendererProvider({
  components = EMPTY_COMPONENT_CATALOG,
  resolveLabel = defaultResolveLabel,
  logger = consoleLogger,
  children,
}: EntityRendererProviderProps): ReactNode {
  const value = useMemo<EntityRendererContextValue>(
    () => ({ components, resolveLabel, logger }),
    [components, resolveLabel, logger]
  );
  return <EntityRendererContext.Provider value={value}>{children}</EntityRendererContext.Provider>;
}

/** Reads the renderer logger. Falls back to a console shim outside a provider. */
export function useEntityRendererLogger(): Logger {
  const ctx = useContext(EntityRendererContext);
  return ctx?.logger ?? consoleLogger;
}

/**
 * Reads the renderer context. Throws when used outside an
 * `<EntityRendererProvider>` — the renderers depend on the catalog being
 * present, so a missing provider is a programming error worth surfacing
 * loudly rather than rendering silently against an empty catalog.
 */
export function useEntityRenderer(): EntityRendererContextValue {
  const ctx = useContext(EntityRendererContext);
  if (!ctx) {
    throw new Error('useEntityRenderer must be called inside an <EntityRendererProvider>.');
  }
  return ctx;
}
