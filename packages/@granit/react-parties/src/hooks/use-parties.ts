import {
  activateParty,
  addPartyAddress,
  addPartyEmail,
  addPartyExternalMapping,
  addPartyPhone,
  addPartyRole,
  archiveParty,
  clearPartyTaxStatus,
  confirmPartyAddress,
  createParty,
  downloadPartyVCard,
  getPartyById,
  listParties,
  removePartyAddress,
  removePartyEmail,
  removePartyExternalMapping,
  removePartyPhone,
  removePartyRole,
  replacePartyMetadata,
  setPartyTaxStatus,
  suspendParty,
  updateParty,
} from '@granit/parties';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logger } from '../logger';
import { buildPartiesQueryKey, usePartiesConfig } from '../providers/parties-provider';

import type {
  CreatePartyOptions,
  PartyAddressConfirmRequest,
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingRequest,
  PartyId,
  PartyListItemResponse,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyRole,
  PartyRoleRequest,
  PartySuspendRequest,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '@granit/parties';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ── Queries ──────────────────────────────────────────────────────────────

/**
 * List parties in the active scope, optionally filtered by role flag.
 *
 * @example
 * ```tsx
 * const { data: parties } = usePartiesQuery();
 * const { data: customers } = usePartiesQuery({ role: 'Customer' });
 * ```
 */
export function usePartiesQuery(options?: {
  readonly role?: string;
}): UseQueryResult<readonly PartyListItemResponse[]> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const role = options?.role;

  return useQuery({
    queryKey: buildPartiesQueryKey(config, 'list', role ?? 'all'),
    queryFn: () => listParties(config.client, basePath, role ? { role } : undefined),
  });
}

/**
 * Fetch a single party by id.
 *
 * @example
 * ```tsx
 * const { data: party } = usePartyQuery(id);
 * ```
 */
export function usePartyQuery(id: PartyId | null | undefined): UseQueryResult<PartyResponse> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildPartiesQueryKey(config, 'detail', id ?? null),
    queryFn: () => getPartyById(config.client, basePath, id as PartyId),
    enabled: id != null,
  });
}

// ── Mutations: identity ──────────────────────────────────────────────────

function useInvalidator() {
  const config = usePartiesConfig();
  const queryClient = useQueryClient();

  return {
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: buildPartiesQueryKey(config, 'list') }),
    invalidateDetail: (id: PartyId) =>
      queryClient.invalidateQueries({ queryKey: buildPartiesQueryKey(config, 'detail', id) }),
    invalidateAll: async (id: PartyId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: buildPartiesQueryKey(config, 'list') }),
        queryClient.invalidateQueries({
          queryKey: buildPartiesQueryKey(config, 'detail', id),
        }),
      ]);
    },
  };
}

/**
 * Variables for {@link useCreatePartyMutation}. Carries the request body plus
 * optional per-call duplicate-check bypass flags ({@link CreatePartyOptions}).
 *
 * On a Tier-1 duplicate match the server returns 409; the AxiosError surfaces
 * a {@link PartyCreateConflictResponse} body in `error.response.data` so the
 * UI can render the "potential duplicates" dialog (use existing / create
 * anyway / merge into existing).
 */
export interface CreatePartyMutationVariables {
  readonly request: PartyCreateRequest;
  readonly options?: CreatePartyOptions;
}

/** Create a new party. Invalidates the list query on success. */
export function useCreatePartyMutation(): UseMutationResult<
  PartyResponse,
  Error,
  CreatePartyMutationVariables
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateList } = useInvalidator();

  return useMutation({
    mutationFn: ({ request, options }: CreatePartyMutationVariables) =>
      createParty(config.client, basePath, request, options),
    onSuccess: (data) => {
      logger.debug('Party created', { id: data.id });
      invalidateList();
    },
  });
}

/** Update a party's identity (name / website / language / timezone). */
export function useUpdatePartyMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyUpdateRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => updateParty(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party updated', { id });
      invalidateAll(id);
    },
  });
}

// ── Mutations: lifecycle ─────────────────────────────────────────────────

/** Suspend a party (idempotent; throws 409 on Archived). */
export function useSuspendPartyMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly request?: PartySuspendRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => suspendParty(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party suspended', { id });
      invalidateAll(id);
    },
  });
}

/** Reactivate a suspended party (idempotent; throws 409 on Archived). */
export function useActivatePartyMutation(): UseMutationResult<void, Error, PartyId> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: (id: PartyId) => activateParty(config.client, basePath, id),
    onSuccess: (_data, id) => {
      logger.debug('Party activated', { id });
      invalidateAll(id);
    },
  });
}

/** Archive a party (terminal). Idempotent. */
export function useArchivePartyMutation(): UseMutationResult<void, Error, PartyId> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: (id: PartyId) => archiveParty(config.client, basePath, id),
    onSuccess: (_data, id) => {
      logger.debug('Party archived', { id });
      invalidateAll(id);
    },
  });
}

// ── Mutations: addresses ─────────────────────────────────────────────────

/** Add a typed address to a party. */
export function useAddPartyAddressMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyAddressRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => addPartyAddress(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party address added', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to add party address', { id, error }),
  });
}

/** Remove an address from a party. Idempotent. */
export function useRemovePartyAddressMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly addressId: PartyAddressId }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, addressId }) => removePartyAddress(config.client, basePath, id, addressId),
    onSuccess: (_data, { id }) => {
      logger.debug('Party address removed', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to remove party address', { id, error }),
  });
}

/**
 * Record a manual deliverability confirmation for a party address (tier-2
 * evidence). Requires the dedicated Confirm permission server-side.
 */
export function useConfirmPartyAddressMutation(): UseMutationResult<
  PartyResponse,
  Error,
  {
    readonly id: PartyId;
    readonly addressId: PartyAddressId;
    readonly request?: PartyAddressConfirmRequest;
  }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, addressId, request }) =>
      confirmPartyAddress(config.client, basePath, id, addressId, request),
    onSuccess: (_data, { id, addressId }) => {
      logger.debug('Party address confirmed', { id, addressId });
      invalidateAll(id);
    },
    onError: (error, { id, addressId }) =>
      logger.error('Failed to confirm party address', { id, addressId, error }),
  });
}

// ── Mutations: emails ────────────────────────────────────────────────────

/** Add an email to a party. */
export function useAddPartyEmailMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyEmailRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => addPartyEmail(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party email added', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to add party email', { id, error }),
  });
}

/** Remove an email from a party. Idempotent. */
export function useRemovePartyEmailMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly emailId: PartyEmailId }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, emailId }) => removePartyEmail(config.client, basePath, id, emailId),
    onSuccess: (_data, { id }) => {
      logger.debug('Party email removed', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to remove party email', { id, error }),
  });
}

// ── Mutations: phones ────────────────────────────────────────────────────

/** Add a typed phone to a party. */
export function useAddPartyPhoneMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyPhoneRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => addPartyPhone(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party phone added', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to add party phone', { id, error }),
  });
}

/** Remove a phone from a party. Idempotent. */
export function useRemovePartyPhoneMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly phoneId: PartyPhoneId }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, phoneId }) => removePartyPhone(config.client, basePath, id, phoneId),
    onSuccess: (_data, { id }) => {
      logger.debug('Party phone removed', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to remove party phone', { id, error }),
  });
}

// ── Mutations: external mappings ─────────────────────────────────────────

/** Register a polyglot external mapping (Stripe / Mollie / Odoo / …). */
export function useAddPartyExternalMappingMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyExternalMappingRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => addPartyExternalMapping(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party external mapping added', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to add party external mapping', { id, error }),
  });
}

/** Remove the party's external mapping for the given provider. Idempotent. */
export function useRemovePartyExternalMappingMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly providerName: string }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, providerName }) =>
      removePartyExternalMapping(config.client, basePath, id, providerName),
    onSuccess: (_data, { id }) => {
      logger.debug('Party external mapping removed', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) =>
      logger.error('Failed to remove party external mapping', { id, error }),
  });
}

// ── Mutations: roles ─────────────────────────────────────────────────────

/** Add a role flag to a party. Idempotent. */
export function useAddPartyRoleMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly request: PartyRoleRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => addPartyRole(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party role added', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to add party role', { id, error }),
  });
}

/** Remove a role flag from a party. Idempotent. */
export function useRemovePartyRoleMutation(): UseMutationResult<
  void,
  Error,
  { readonly id: PartyId; readonly role: PartyRole }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, role }) => removePartyRole(config.client, basePath, id, role),
    onSuccess: (_data, { id }) => {
      logger.debug('Party role removed', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to remove party role', { id, error }),
  });
}

// ── Mutations: tax status ────────────────────────────────────────────────

/** Apply a customer-specific tax status (exempt / reverse-charge) to a party. */
export function useSetPartyTaxStatusMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyTaxStatusRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => setPartyTaxStatus(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party tax status set', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to set party tax status', { id, error }),
  });
}

/** Reset a party's tax status to the default (no special classification). Idempotent. */
export function useClearPartyTaxStatusMutation(): UseMutationResult<PartyResponse, Error, PartyId> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: (id: PartyId) => clearPartyTaxStatus(config.client, basePath, id),
    onSuccess: (_data, id) => {
      logger.debug('Party tax status cleared', { id });
      invalidateAll(id);
    },
    onError: (error, id) => logger.error('Failed to clear party tax status', { id, error }),
  });
}

// ── Mutations: metadata ──────────────────────────────────────────────────

/**
 * Bulk-replace a party's free-form metadata dictionary. Pass `{ metadata: {} }`
 * to clear all entries.
 */
export function useReplacePartyMetadataMutation(): UseMutationResult<
  PartyResponse,
  Error,
  { readonly id: PartyId; readonly request: PartyMetadataRequest }
> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;
  const { invalidateAll } = useInvalidator();

  return useMutation({
    mutationFn: ({ id, request }) => replacePartyMetadata(config.client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.debug('Party metadata replaced', { id });
      invalidateAll(id);
    },
    onError: (error, { id }) => logger.error('Failed to replace party metadata', { id, error }),
  });
}

// ── vCard ────────────────────────────────────────────────────────────────

/**
 * Download a party's vCard 4.0 (RFC 6350) as a `Blob`. Exposed as a mutation so
 * callers get `isPending` / `error` and consistent logging without re-implementing
 * the direct `downloadPartyVCard` call. Pure read — no cache invalidation.
 */
export function useDownloadPartyVCard(): UseMutationResult<Blob, Error, PartyId> {
  const config = usePartiesConfig();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: PartyId) => downloadPartyVCard(config.client, basePath, id),
    onSuccess: (_data, id) => logger.debug('Party vCard downloaded', { id }),
    onError: (error, id) => logger.error('Failed to download party vCard', { id, error }),
  });
}
