import { createConfigProvider } from '@granit/react-api-client';
import { QueryProvider } from '@granit/react-query-engine';
import { useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { QueryConfig } from '@granit/query-engine';
import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';
import type { ReactNode } from 'react';

/** Configuration for the metering provider. */
export interface MeteringConfig extends GranitProviderConfig {
  /** Base path for metering endpoints (default: `/api/v1/metering`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * MeteringConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export type ResolvedMeteringConfig = ResolvedGranitProviderConfig<MeteringConfig>;

export type MeteringProviderProps = GranitProviderProps<MeteringConfig>;

const { Provider: ConfigProvider, useConfig } = createConfigProvider<MeteringConfig>({
  name: 'Metering',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/**
 * Provides metering configuration to child components and hooks, and wires the
 * QueryEngine surface for the meter catalog grid: `GET {basePath}/meters` is a
 * `MapGranitQuery<MeterDefinitionResponse>` endpoint (it ships a `/meta`), so
 * the list is driven by `useMetersQuery` (useQueryEndpoint) under this provider.
 */
export function MeteringProvider({ config, children }: Readonly<MeteringProviderProps>) {
  return (
    <ConfigProvider config={config}>
      <MeteringQueryScope>{children}</MeteringQueryScope>
    </ConfigProvider>
  );
}

/** Mounts the meter-catalog `QueryProvider` from the resolved config. */
function MeteringQueryScope({ children }: { readonly children: ReactNode }) {
  const config = useConfig();
  const queryConfig = useMemo<QueryConfig>(
    () => ({ client: config.client, basePath: `${config.basePath}/meters` }),
    [config]
  );
  return <QueryProvider config={queryConfig}>{children}</QueryProvider>;
}

/** Returns the metering configuration from the nearest `MeteringProvider`. */
export const useMeteringConfig = useConfig;

/** Builds a consistent React Query key for metering operations. */
export function buildMeteringQueryKey(
  config: MeteringConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['metering'];
  return [...prefix, ...segments];
}
