import { createInvoice, downloadInvoicePdf, getInvoiceById, listInvoices } from '@granit/invoicing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildInvoicingQueryKey, useInvoicingConfig } from '../providers/invoicing-provider.js';

import type { InvoiceCreateRequest, InvoiceResponse } from '@granit/invoicing';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch all invoices.
 *
 * @example
 * ```tsx
 * const { data: invoices } = useInvoices();
 * ```
 */
export function useInvoices(): UseQueryResult<readonly InvoiceResponse[]> {
  const config = useInvoicingConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildInvoicingQueryKey(config, 'invoices', 'list'),
    queryFn: () => listInvoices(config.client, basePath),
  });
}

/**
 * Fetch a single invoice by ID.
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: invoice } = useInvoice(selectedId);
 * ```
 */
export function useInvoice(id: string): UseQueryResult<InvoiceResponse> {
  const config = useInvoicingConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildInvoicingQueryKey(config, 'invoices', id),
    queryFn: () => getInvoiceById(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Download the PDF for an invoice.
 *
 * Returns a `Blob` that can be used to trigger a browser download.
 *
 * @example
 * ```tsx
 * const downloadPdf = useDownloadInvoicePdf();
 * await downloadPdf.mutateAsync('inv-1');
 * ```
 */
export function useDownloadInvoicePdf(): UseMutationResult<Blob, Error, string> {
  const config = useInvoicingConfig();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => downloadInvoicePdf(config.client, basePath, id),
  });
}

/**
 * Create a new invoice.
 * Invalidates invoice queries on success.
 *
 * @example
 * ```tsx
 * const create = useCreateInvoice();
 * await create.mutateAsync({ documentType: 'Invoice', currency: 'EUR', ... });
 * ```
 */
export function useCreateInvoice(): UseMutationResult<
  InvoiceResponse,
  Error,
  InvoiceCreateRequest
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: InvoiceCreateRequest) => createInvoice(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}
