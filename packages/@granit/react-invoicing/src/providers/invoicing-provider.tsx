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

/** Configuration for the invoicing provider. */
export interface InvoicingConfig extends GranitProviderConfig {
  /** Base path for invoicing endpoints (default: `/api/v1/invoicing`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * InvoicingConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedInvoicingConfig = ResolvedGranitProviderConfig<InvoicingConfig>;

export type InvoicingProviderProps = GranitProviderProps<InvoicingConfig>;

const { Provider: ConfigProvider, useConfig } = createConfigProvider<InvoicingConfig>({
  name: 'Invoicing',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/**
 * Provides invoicing configuration to child components and hooks, and wires the
 * QueryEngine surface for the invoice grid: `GET {basePath}/invoices` is a
 * `MapGranitQuery<InvoiceResponse>` endpoint (it ships a `/meta`), so the list
 * is driven by `useInvoiceQuery` (useQueryEndpoint) under this provider.
 */
export function InvoicingProvider({ config, children }: Readonly<InvoicingProviderProps>) {
  return (
    <ConfigProvider config={config}>
      <InvoicingQueryScope>{children}</InvoicingQueryScope>
    </ConfigProvider>
  );
}

/** Mounts the invoice-grid `QueryProvider` from the resolved config. */
function InvoicingQueryScope({ children }: { readonly children: ReactNode }) {
  const config = useConfig();
  const queryConfig = useMemo<QueryConfig>(
    () => ({ client: config.client, basePath: `${config.basePath}/invoices` }),
    [config]
  );
  return <QueryProvider config={queryConfig}>{children}</QueryProvider>;
}

/** Returns the invoicing configuration from the nearest `InvoicingProvider`. */
export const useInvoicingConfig = useConfig;
