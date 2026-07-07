import type { InvoicingConfig } from '../providers/invoicing-provider';

/** Builds a consistent React Query key for invoicing operations. */
export function buildInvoicingQueryKey(
  config: InvoicingConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['invoicing'];
  return [...prefix, ...segments];
}
