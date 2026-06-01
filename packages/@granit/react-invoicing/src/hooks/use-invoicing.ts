import {
  cancelInvoice,
  createInvoice,
  downloadInvoicePdf,
  finalizeInvoice,
  getInvoiceById,
  listInvoices,
  markInvoiceUncollectible,
} from '@granit/invoicing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildInvoicingQueryKey, useInvoicingConfig } from '../providers/invoicing-provider';

import type {
  CancelInvoiceRequest,
  FinalizeInvoiceRequest,
  InvoiceCreateRequest,
  InvoiceResponse,
  MarkInvoiceUncollectibleRequest,
} from '@granit/invoicing';
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

/** Variables for the semantic transition mutations: invoice id + optional request body. */
export interface InvoiceTransitionVariables<TRequest> {
  readonly id: string;
  readonly request?: TRequest;
}

/**
 * Finalize a Draft invoice (Draft → Open).
 * Invalidates invoice queries on success.
 *
 * @example
 * ```tsx
 * const finalize = useFinalizeInvoice();
 * await finalize.mutateAsync({ id: 'inv-1', request: { issuedAt, dueAt } });
 * ```
 */
export function useFinalizeInvoice(): UseMutationResult<
  InvoiceResponse,
  Error,
  { readonly id: string; readonly request: FinalizeInvoiceRequest }
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }) => finalizeInvoice(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}

/**
 * Cancel an invoice (Open / Uncollectible → Cancelled).
 * Invalidates invoice queries on success.
 *
 * @example
 * ```tsx
 * const cancel = useCancelInvoice();
 * await cancel.mutateAsync({ id: 'inv-1', request: { reason: 'Duplicate' } });
 * ```
 */
export function useCancelInvoice(): UseMutationResult<
  InvoiceResponse,
  Error,
  InvoiceTransitionVariables<CancelInvoiceRequest>
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }) => cancelInvoice(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}

/**
 * Mark an Open invoice as Uncollectible (bad debt).
 * Invalidates invoice queries on success.
 *
 * @example
 * ```tsx
 * const markUncollectible = useMarkInvoiceUncollectible();
 * await markUncollectible.mutateAsync({ id: 'inv-1', request: { reason: 'Bankruptcy' } });
 * ```
 */
export function useMarkInvoiceUncollectible(): UseMutationResult<
  InvoiceResponse,
  Error,
  InvoiceTransitionVariables<MarkInvoiceUncollectibleRequest>
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }) => markInvoiceUncollectible(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}
