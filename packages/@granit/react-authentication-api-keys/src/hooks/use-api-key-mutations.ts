import {
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  updateApiKeyScopes,
} from '@granit/authentication-api-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { buildApiKeyQueryKey } from './use-api-keys.js';

import type { ApiKeyHookOptions } from './use-api-keys.js';
import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyRotateResponse,
  ApiKeyUpdateScopesRequest,
} from '@granit/authentication-api-keys';
import type { UseMutationResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// useCreateApiKey
// ---------------------------------------------------------------------------

/**
 * Mutation to create a new API key.
 *
 * Calls `POST {basePath}` and invalidates the list cache on success.
 *
 * @param options - Axios client and optional base path.
 *
 * @example
 * ```tsx
 * const create = useCreateApiKey({ client: api });
 * create.mutate({ name: 'My key', type: 'Secret', environment: 'production' });
 * ```
 */
export function useCreateApiKey(
  options: ApiKeyHookOptions
): UseMutationResult<ApiKeyCreateResponse, Error, ApiKeyCreateRequest> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ApiKeyCreateRequest) => createApiKey(client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'list') });
    },
  });
}

// ---------------------------------------------------------------------------
// useRevokeApiKey
// ---------------------------------------------------------------------------

/**
 * Mutation to revoke an API key.
 *
 * Calls `POST {basePath}/{id}/revoke` and invalidates both the list and the
 * specific key's detail cache on success.
 *
 * @param options - Axios client and optional base path.
 *
 * @example
 * ```tsx
 * const revoke = useRevokeApiKey({ client: api });
 * revoke.mutate('key-123');
 * ```
 */
export function useRevokeApiKey(
  options: ApiKeyHookOptions
): UseMutationResult<void, Error, string> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeApiKey(client, basePath, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'list') });
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'detail', id) });
    },
  });
}

// ---------------------------------------------------------------------------
// useRotateApiKey
// ---------------------------------------------------------------------------

/**
 * Mutation to rotate an API key, generating a new secret.
 *
 * Calls `POST {basePath}/{id}/rotate` and invalidates both the list and the
 * specific key's detail cache on success.
 *
 * @param options - Axios client and optional base path.
 *
 * @example
 * ```tsx
 * const rotate = useRotateApiKey({ client: api });
 * const result = await rotate.mutateAsync('key-123');
 * console.log(result.rawSecret); // store this — it will not be shown again
 * ```
 */
export function useRotateApiKey(
  options: ApiKeyHookOptions
): UseMutationResult<ApiKeyRotateResponse, Error, string> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rotateApiKey(client, basePath, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'list') });
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'detail', id) });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateApiKeyScopes
// ---------------------------------------------------------------------------

/** Variables for the {@link useUpdateApiKeyScopes} mutation. */
export interface UpdateApiKeyScopesVariables {
  id: string;
  request: ApiKeyUpdateScopesRequest;
}

/**
 * Mutation to update the permissions and allowed CIDRs of an API key.
 *
 * Calls `PUT {basePath}/{id}/scopes` and invalidates both the list and the
 * specific key's detail cache on success.
 *
 * @param options - Axios client and optional base path.
 *
 * @example
 * ```tsx
 * const updateScopes = useUpdateApiKeyScopes({ client: api });
 * updateScopes.mutate({
 *   id: 'key-123',
 *   request: { permissions: ['Invoices.Read'], allowedCidrs: ['10.0.0.0/8'] },
 * });
 * ```
 */
export function useUpdateApiKeyScopes(
  options: ApiKeyHookOptions
): UseMutationResult<void, Error, UpdateApiKeyScopesVariables> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: UpdateApiKeyScopesVariables) =>
      updateApiKeyScopes(client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'list') });
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(options, 'detail', id) });
    },
  });
}
