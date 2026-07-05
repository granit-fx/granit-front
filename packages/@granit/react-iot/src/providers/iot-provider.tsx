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

/** Configuration for the IoT provider. */
export interface IotConfig extends GranitProviderConfig {
  /** Base path for IoT endpoints (default: `/api/v1/iot`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * IotConfig after the provider has resolved `client` from `config.client` or the
 * nearest `<GranitClientProvider>` and defaulted `basePath`. Both are guaranteed
 * present, so hooks read them without a non-null assertion.
 */
export type ResolvedIotConfig = ResolvedGranitProviderConfig<IotConfig>;

export type IotProviderProps = GranitProviderProps<IotConfig>;

const { Provider: ConfigProvider, useConfig } = createConfigProvider<IotConfig>({
  name: 'Iot',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/**
 * Provides IoT configuration to child components and hooks, and wires the
 * QueryEngine surface for the device fleet grid: `GET {basePath}/devices` is a
 * `MapGranitQuery<Device>` endpoint (it ships a `/meta`), so the list is driven
 * by `useDevicesQuery` (useQueryEndpoint) under this provider.
 *
 * The telemetry grid is a sibling surface scoped by {@link IotTelemetryProvider}.
 */
export function IotProvider({ config, children }: Readonly<IotProviderProps>) {
  return (
    <ConfigProvider config={config}>
      <IotQueryScope resource="devices">{children}</IotQueryScope>
    </ConfigProvider>
  );
}

/**
 * Mounts the telemetry `QueryProvider` scoped to `{basePath}/telemetry` — the
 * sibling QueryEngine surface to the device fleet grid. Must sit inside an
 * {@link IotProvider} (it reads the resolved config). Wrap the telemetry grid
 * with this instead of re-wiring a `QueryProvider` in the UI layer.
 */
export function IotTelemetryProvider({ children }: { readonly children: ReactNode }) {
  return <IotQueryScope resource="telemetry">{children}</IotQueryScope>;
}

/** Mounts a `QueryProvider` scoped to `{basePath}/{resource}` from the resolved config. */
function IotQueryScope({
  resource,
  children,
}: {
  readonly resource: string;
  readonly children: ReactNode;
}) {
  const config = useConfig();
  const queryConfig = useMemo<QueryConfig>(
    () => ({ client: config.client, basePath: `${config.basePath}/${resource}` }),
    [config, resource]
  );
  return <QueryProvider config={queryConfig}>{children}</QueryProvider>;
}

/** Returns the IoT configuration from the nearest `IotProvider`. */
export const useIotConfig = useConfig;

/** Builds a consistent React Query key for IoT operations. */
export function buildIotQueryKey(
  config: IotConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['iot'];
  return [...prefix, ...segments];
}
