import { createContext, useContext, useMemo } from 'react';

import { useOptionalGranitClient } from './granit-client-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/**
 * Minimal config every Granit domain provider accepts: an optional Axios
 * `client` (falls back to the nearest `<GranitClientProvider>`) and an optional
 * `basePath` (falls back to the package default). Domain configs extend this
 * with their own optional fields (e.g. `queryKeyPrefix`).
 */
export interface GranitProviderConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
}

/**
 * A domain config after the provider has resolved `client` and `basePath`, so
 * hooks read both without a non-null assertion. Extra fields on `TConfig` flow
 * through unchanged.
 */
export type ResolvedGranitProviderConfig<TConfig extends GranitProviderConfig> = TConfig & {
  readonly client: AxiosInstance;
  readonly basePath: string;
};

/** Props of a provider produced by {@link createConfigProvider}. */
export interface GranitProviderProps<TConfig extends GranitProviderConfig> {
  readonly config: TConfig;
  readonly children: ReactNode;
}

export interface CreateConfigProviderOptions<
  TConfig extends GranitProviderConfig,
  TResolved extends ResolvedGranitProviderConfig<TConfig>,
> {
  /**
   * PascalCase domain name used to build the component `displayName` and the
   * error messages (`<Name>Provider requires…`, `use<Name>Config must be used…`).
   */
  readonly name: string;
  /** Base path applied when `config.basePath` is omitted. */
  readonly defaultBasePath: string;
  /**
   * Optional hook to derive fields beyond `client`/`basePath` (e.g. default a
   * `queryKeyPrefix`). Receives the base-resolved config (client + basePath
   * applied) and the raw config, and returns the fully-resolved value.
   * **Required whenever `TResolved` adds fields** beyond the base resolution —
   * without it the provider would expose a value missing those fields.
   */
  readonly resolve?: (base: ResolvedGranitProviderConfig<TConfig>, raw: TConfig) => TResolved;
}

export interface ConfigProvider<
  TConfig extends GranitProviderConfig,
  TResolved extends ResolvedGranitProviderConfig<TConfig> = ResolvedGranitProviderConfig<TConfig>,
> {
  /** Context provider resolving `client`/`basePath` (and `resolve` extras) for descendant hooks. */
  readonly Provider: (props: GranitProviderProps<TConfig>) => ReactNode;
  /** Reads the resolved config from the nearest matching provider; throws if absent. */
  readonly useConfig: () => TResolved;
  /** Reads the resolved config from the nearest matching provider, or `null` if absent. */
  readonly useOptionalConfig: () => TResolved | null;
}

/**
 * Builds the standard Granit domain-provider triplet — context, `<Provider>`,
 * and `use…Config` hook — that every `@granit/react-*` package otherwise
 * hand-writes verbatim. The provider resolves `client` from `config.client` or
 * the nearest `<GranitClientProvider>` (throwing when neither is present) and
 * defaults `basePath`; the hook throws when used outside its provider.
 *
 * Re-export the returned members under the package's public names so consumers
 * (e.g. showcase-admin-react) see no API change:
 *
 * For a config that defaults extra fields, pass an explicit resolved type and a
 * `resolve` hook:
 *
 * @example
 * ```tsx
 * export interface DocumentsConfig extends GranitProviderConfig {
 *   readonly queryKeyPrefix?: readonly string[];
 * }
 * export interface ResolvedDocumentsConfig extends DocumentsConfig {
 *   readonly client: AxiosInstance;
 *   readonly basePath: string;
 *   readonly queryKeyPrefix: readonly string[];
 * }
 *
 * const { Provider, useConfig } = createConfigProvider<DocumentsConfig, ResolvedDocumentsConfig>({
 *   name: 'Documents',
 *   defaultBasePath: DEFAULT_BASE_PATH,
 *   resolve: (base) => ({ ...base, queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX] }),
 * });
 * export const DocumentsProvider = Provider;
 * export const useDocumentsConfig = useConfig;
 * ```
 */
export function createConfigProvider<
  TConfig extends GranitProviderConfig,
  TResolved extends ResolvedGranitProviderConfig<TConfig> = ResolvedGranitProviderConfig<TConfig>,
>({
  name,
  defaultBasePath,
  resolve,
}: CreateConfigProviderOptions<TConfig, TResolved>): ConfigProvider<TConfig, TResolved> {
  const Context = createContext<TResolved | null>(null);
  Context.displayName = `${name}ConfigContext`;

  function Provider({ config, children }: GranitProviderProps<TConfig>) {
    const contextClient = useOptionalGranitClient();
    const value = useMemo<TResolved>(() => {
      const client = config.client ?? contextClient;
      if (!client) {
        throw new Error(
          `${name}Provider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.`
        );
      }
      const base = {
        ...config,
        client,
        basePath: config.basePath ?? defaultBasePath,
      } as ResolvedGranitProviderConfig<TConfig>;
      return (resolve ? resolve(base, config) : base) as TResolved;
    }, [config, contextClient]);
    return <Context value={value}>{children}</Context>;
  }
  Provider.displayName = `${name}Provider`;

  function useConfig(): TResolved {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error(`use${name}Config must be used within a <${name}Provider>`);
    }
    return ctx;
  }

  function useOptionalConfig(): TResolved | null {
    return useContext(Context);
  }

  return { Provider, useConfig, useOptionalConfig };
}
