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

export interface CreateConfigProviderOptions {
  /**
   * PascalCase domain name used to build the component `displayName` and the
   * error messages (`<Name>Provider requires…`, `use<Name>Config must be used…`).
   */
  readonly name: string;
  /** Base path applied when `config.basePath` is omitted. */
  readonly defaultBasePath: string;
}

export interface ConfigProvider<TConfig extends GranitProviderConfig> {
  /** Context provider resolving `client`/`basePath` for descendant hooks. */
  readonly Provider: (props: GranitProviderProps<TConfig>) => ReactNode;
  /** Reads the resolved config from the nearest matching provider; throws if absent. */
  readonly useConfig: () => ResolvedGranitProviderConfig<TConfig>;
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
 * @example
 * ```tsx
 * export interface HostnamesConfig extends GranitProviderConfig {
 *   readonly queryKeyPrefix?: readonly string[];
 * }
 * export type ResolvedHostnamesConfig = ResolvedGranitProviderConfig<HostnamesConfig>;
 *
 * const { Provider, useConfig } = createConfigProvider<HostnamesConfig>({
 *   name: 'Hostnames',
 *   defaultBasePath: DEFAULT_BASE_PATH,
 * });
 * export const HostnamesProvider = Provider;
 * export const useHostnamesConfig = useConfig;
 * ```
 */
export function createConfigProvider<TConfig extends GranitProviderConfig>({
  name,
  defaultBasePath,
}: CreateConfigProviderOptions): ConfigProvider<TConfig> {
  type Resolved = ResolvedGranitProviderConfig<TConfig>;
  const Context = createContext<Resolved | null>(null);
  Context.displayName = `${name}ConfigContext`;

  function Provider({ config, children }: GranitProviderProps<TConfig>) {
    const contextClient = useOptionalGranitClient();
    const value = useMemo<Resolved>(() => {
      const client = config.client ?? contextClient;
      if (!client) {
        throw new Error(
          `${name}Provider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.`
        );
      }
      return { ...config, client, basePath: config.basePath ?? defaultBasePath };
    }, [config, contextClient]);
    return <Context value={value}>{children}</Context>;
  }
  Provider.displayName = `${name}Provider`;

  function useConfig(): Resolved {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error(`use${name}Config must be used within a <${name}Provider>`);
    }
    return ctx;
  }

  return { Provider, useConfig };
}
