import {
  cancelInvoice,
  createInvoice,
  downloadInvoicePdf,
  executeInvoiceTransition,
  finalizeInvoice,
  getInvoiceById,
  getInvoiceMeta,
  listInvoiceTransitions,
  markInvoiceUncollectible,
  queryInvoices,
} from '@granit/invoicing';
import { useQueryEndpoint } from '@granit/react-query-engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useInvoicingConfig } from '../providers/invoicing-provider';

import { buildInvoicingQueryKey } from './query-keys';

import type {
  CancelInvoiceRequest,
  FinalizeInvoiceRequest,
  InvoiceCreateRequest,
  InvoiceResponse,
  MarkInvoiceUncollectibleRequest,
} from '@granit/invoicing';
import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';
import type { UseQueryEndpointOptions, UseQueryEndpointReturn } from '@granit/react-query-engine';
import type {
  WorkflowStatus,
  WorkflowTransitionRequest,
  WorkflowTransitionResult,
} from '@granit/workflow';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Query invoices with optional filtering, sorting, and pagination.
 *
 * @example
 * ```tsx
 * const { data } = useInvoices();
 * const rows = data?.items ?? [];
 * ```
 */
export function useInvoices(
  request: QueryRequest = {}
): UseQueryResult<PagedResult<InvoiceResponse>> {
  const config = useInvoicingConfig();

  return useQuery({
    queryKey: [...buildInvoicingQueryKey(config, 'invoices', 'list'), request],
    queryFn: () => queryInvoices(config.client, config.basePath!, request),
  });
}

/**
 * QueryEngine endpoint for invoices ({@link InvoiceResponse}), backed by the
 * `MapGranitQuery<InvoiceResponse>()` group under `{basePath}/invoices`. Owns the
 * pagination / filter / sort / group-by state and exposes the dispatchers plus
 * the paged result — the standard surface for the interactive invoice grid
 * (prefer this over {@link useInvoices} for list pages). Must be used within an
 * {@link InvoicingProvider}, which wires the inner `QueryProvider`.
 *
 * @example
 * ```tsx
 * const { query, params, setPage, setPageSize } = useInvoiceQuery();
 * query.data?.items.map((inv) => inv.number);
 * ```
 */
export function useInvoiceQuery(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<InvoiceResponse> {
  return useQueryEndpoint<InvoiceResponse>(options);
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

  return useQuery({
    queryKey: buildInvoicingQueryKey(config, 'invoices', id),
    queryFn: () => getInvoiceById(config.client, config.basePath!, id),
    enabled: id.length > 0,
  });
}

/**
 * Fetch query metadata for invoices (columns, filterable fields, presets, etc.).
 *
 * @example
 * ```tsx
 * const { data: meta } = useInvoiceMeta();
 * ```
 */
export function useInvoiceMeta(): UseQueryResult<QueryMetadata> {
  const config = useInvoicingConfig();

  return useQuery({
    queryKey: buildInvoicingQueryKey(config, 'invoices', 'meta'),
    queryFn: () => getInvoiceMeta(config.client, config.basePath!),
    staleTime: Infinity,
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

  return useMutation({
    mutationFn: (id: string) => downloadInvoicePdf(config.client, config.basePath!, id),
  });
}

/**
 * Create a new invoice.
 * Invalidates invoice queries on success.
 *
 * @example
 * ```tsx
 * const create = useCreateInvoice();
 * await create.mutateAsync({ partyId: '...', documentType: 'Invoice', currency: 'EUR', ... });
 * ```
 */
export function useCreateInvoice(): UseMutationResult<
  InvoiceResponse,
  Error,
  InvoiceCreateRequest
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: InvoiceCreateRequest) =>
      createInvoice(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}

/** Variables for semantic transition mutations: invoice id + optional request body. */
export interface InvoiceTransitionVariables<TRequest> {
  readonly id: string;
  readonly request?: TRequest;
}

/**
 * Finalize a Draft invoice (Draft → Open).
 * Invalidates invoice queries on success.
 */
export function useFinalizeInvoice(): UseMutationResult<
  InvoiceResponse,
  Error,
  { readonly id: string; readonly request: FinalizeInvoiceRequest }
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => finalizeInvoice(config.client, config.basePath!, id, request),
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
 */
export function useCancelInvoice(): UseMutationResult<
  InvoiceResponse,
  Error,
  InvoiceTransitionVariables<CancelInvoiceRequest>
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => cancelInvoice(config.client, config.basePath!, id, request),
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
 */
export function useMarkInvoiceUncollectible(): UseMutationResult<
  InvoiceResponse,
  Error,
  InvoiceTransitionVariables<MarkInvoiceUncollectibleRequest>
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) =>
      markInvoiceUncollectible(config.client, config.basePath!, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}

/**
 * List available workflow transitions for a given invoice status.
 *
 * @example
 * ```tsx
 * const { data: status } = useListInvoiceTransitions(invoice.status);
 * ```
 */
export function useListInvoiceTransitions(currentState: string): UseQueryResult<WorkflowStatus> {
  const config = useInvoicingConfig();

  return useQuery({
    queryKey: buildInvoicingQueryKey(config, 'invoices', 'transitions', currentState),
    queryFn: () => listInvoiceTransitions(config.client, config.basePath!, currentState),
    enabled: currentState.length > 0,
  });
}

/**
 * Execute a workflow transition for an invoice.
 * Invalidates invoice queries on success.
 *
 * @example
 * ```tsx
 * const execute = useExecuteInvoiceTransition();
 * await execute.mutateAsync({ currentState: 'Draft', request: { targetState: 'Open' } });
 * ```
 */
export function useExecuteInvoiceTransition(): UseMutationResult<
  WorkflowTransitionResult,
  Error,
  { readonly currentState: string; readonly request: WorkflowTransitionRequest }
> {
  const config = useInvoicingConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ currentState, request }) =>
      executeInvoiceTransition(config.client, config.basePath!, currentState, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildInvoicingQueryKey(config, 'invoices'),
      });
    },
  });
}
