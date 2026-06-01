import {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  getPasskeys,
  renamePasskey,
} from '@granit/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type {
  AccountPasskeyCreatedResponse,
  AccountPasskeyInfo,
  AccountPasskeyRegistrationRequest,
  AccountPasskeyRenameRequest,
} from '@granit/account';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches all registered passkeys. */
export function usePasskeys(): UseQueryResult<readonly AccountPasskeyInfo[]> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'passkeys'),
    queryFn: () => getPasskeys(config.client, config.basePath!),
  });
}

/** Begins a WebAuthn passkey registration ceremony. Returns raw JSON options. */
export function useBeginPasskeyRegistration(): UseMutationResult<string, Error, void> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: () => beginPasskeyRegistration(config.client, config.basePath!),
  });
}

/** Completes a WebAuthn passkey registration. Invalidates passkeys on success. */
export function useCompletePasskeyRegistration(): UseMutationResult<
  AccountPasskeyCreatedResponse,
  Error,
  AccountPasskeyRegistrationRequest
> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountPasskeyRegistrationRequest) =>
      completePasskeyRegistration(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'passkeys'),
      });
    },
  });
}

/** Rename passkey variables. */
export interface RenamePasskeyVariables {
  readonly id: string;
  readonly request: AccountPasskeyRenameRequest;
}

/** Renames a passkey. Invalidates passkeys on success. */
export function useRenamePasskey(): UseMutationResult<void, Error, RenamePasskeyVariables> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: RenamePasskeyVariables) =>
      renamePasskey(config.client, config.basePath!, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'passkeys'),
      });
    },
  });
}

/** Deletes a passkey. Invalidates passkeys on success. */
export function useDeletePasskey(): UseMutationResult<void, Error, string> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePasskey(config.client, config.basePath!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'passkeys'),
      });
    },
  });
}
