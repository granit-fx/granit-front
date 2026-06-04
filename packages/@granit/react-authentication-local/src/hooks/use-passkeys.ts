import {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  listPasskeys,
  renamePasskey,
} from '@granit/authentication-local';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import { localAuthKeys } from './query-keys';

import type {
  PasskeyInfoResponse,
  PasskeyRegistrationRequest,
  PasskeyRenameRequest,
} from '@granit/authentication-local';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Variables for the {@link useRenamePasskey} mutation. */
export interface RenamePasskeyVariables {
  id: string;
  request: PasskeyRenameRequest;
}

/** Lists the authenticated user's registered passkeys. */
export function usePasskeys(): UseQueryResult<PasskeyInfoResponse[]> {
  const config = useLocalAuthConfig();

  return useQuery({
    queryKey: localAuthKeys.passkeys(),
    queryFn: () => listPasskeys(config.client, config.basePath!),
  });
}

/** Begins a WebAuthn passkey registration ceremony (returns options JSON). */
export function useBeginPasskeyRegistration(): UseMutationResult<string, Error, void> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: () => beginPasskeyRegistration(config.client, config.basePath!),
  });
}

/** Completes a passkey registration and refreshes the passkey list. */
export function useCompletePasskeyRegistration(): UseMutationResult<
  PasskeyInfoResponse,
  Error,
  PasskeyRegistrationRequest
> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PasskeyRegistrationRequest) =>
      completePasskeyRegistration(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.passkeys() });
    },
  });
}

/** Renames a registered passkey and refreshes the passkey list. */
export function useRenamePasskey(): UseMutationResult<void, Error, RenamePasskeyVariables> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: RenamePasskeyVariables) =>
      renamePasskey(config.client, config.basePath!, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.passkeys() });
    },
  });
}

/** Deletes a registered passkey and refreshes the passkey list. */
export function useDeletePasskey(): UseMutationResult<void, Error, string> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePasskey(config.client, config.basePath!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.passkeys() });
    },
  });
}
