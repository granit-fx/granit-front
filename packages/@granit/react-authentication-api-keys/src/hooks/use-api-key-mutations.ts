import {
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  updateApiKeyScopes,
} from '@granit/authentication-api-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '../logger';

import { buildApiKeyQueryKey } from './query-keys';
import { useResolvedApiKeysConfig } from './use-api-keys-config';

import type { ApiKeyHookOptions } from './use-api-keys';
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
 * Calls `POST {basePath}/api-keys` and invalidates the list cache on success.
 *
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 *
 * @example
 * ```tsx
 * const create = useCreateApiKey();
 * create.mutate({ name: 'My key', type: 'Secret', environment: 'production' });
 * ```
 */
export function useCreateApiKey(
  options: ApiKeyHookOptions = {}
): UseMutationResult<ApiKeyCreateResponse, Error, ApiKeyCreateRequest> {
  const config = useResolvedApiKeysConfig(options);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ApiKeyCreateRequest) =>
      createApiKey(config.client, config.basePath, request),
    onSuccess: (result) => {
      logger.info(`api key created id=${result.id}`);
      logger.debug('invalidating api key list cache');
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'list') });
    },
  });
}

// ---------------------------------------------------------------------------
// useRevokeApiKey
// ---------------------------------------------------------------------------

/**
 * Mutation to revoke an API key.
 *
 * Calls `POST {basePath}/api-keys/{id}/revoke` and invalidates both the list and the
 * specific key's detail cache on success.
 *
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 *
 * @example
 * ```tsx
 * const revoke = useRevokeApiKey();
 * revoke.mutate('key-123');
 * ```
 */
export function useRevokeApiKey(
  options: ApiKeyHookOptions = {}
): UseMutationResult<void, Error, string> {
  const config = useResolvedApiKeysConfig(options);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeApiKey(config.client, config.basePath, id),
    onSuccess: (_data, id) => {
      logger.info(`api key revoked id=${id}`);
      logger.debug(`invalidating api key list and detail caches id=${id}`);
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'list') });
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'detail', id) });
    },
  });
}

// ---------------------------------------------------------------------------
// useRotateApiKey
// ---------------------------------------------------------------------------

/**
 * Mutation to rotate an API key, generating a new secret.
 *
 * Calls `POST {basePath}/api-keys/{id}/rotate` and invalidates both the list and the
 * specific key's detail cache on success.
 *
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 *
 * @example
 * ```tsx
 * const rotate = useRotateApiKey();
 * const result = await rotate.mutateAsync('key-123');
 * console.log(result.rawSecret); // store this — it will not be shown again
 * ```
 */
export function useRotateApiKey(
  options: ApiKeyHookOptions = {}
): UseMutationResult<ApiKeyRotateResponse, Error, string> {
  const config = useResolvedApiKeysConfig(options);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rotateApiKey(config.client, config.basePath, id),
    onSuccess: (data, id) => {
      logger.info(`api key rotated newId=${data.newKeyId}`);
      logger.debug(`invalidating api key list and detail caches id=${id}`);
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'list') });
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'detail', id) });
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
 * Calls `PUT {basePath}/api-keys/{id}/scopes` and invalidates both the list and the
 * specific key's detail cache on success.
 *
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 *
 * @example
 * ```tsx
 * const updateScopes = useUpdateApiKeyScopes();
 * updateScopes.mutate({
 *   id: 'key-123',
 *   request: { permissions: ['Invoices.Read'], allowedCidrs: ['10.0.0.0/8'] },
 * });
 * ```
 */
export function useUpdateApiKeyScopes(
  options: ApiKeyHookOptions = {}
): UseMutationResult<void, Error, UpdateApiKeyScopesVariables> {
  const config = useResolvedApiKeysConfig(options);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: UpdateApiKeyScopesVariables) =>
      updateApiKeyScopes(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      logger.info(`api key scopes updated id=${id}`);
      logger.debug(`invalidating api key list and detail caches id=${id}`);
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'list') });
      queryClient.invalidateQueries({ queryKey: buildApiKeyQueryKey(config, 'detail', id) });
    },
  });
}
