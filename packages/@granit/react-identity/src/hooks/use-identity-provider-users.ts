import {
  createUser,
  getProviderUser,
  listProviderUsers,
  setUserEnabled,
  updateUser,
} from '@granit/identity';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildIdentityQueryKey, useIdentityConfig } from '../providers/identity-provider';

import type {
  IdentityProviderUserListParams,
  IdentityUser,
  IdentityUserCreateRequest,
  IdentityUserUpdateRequest,
} from '@granit/identity';
import type { UserId } from '@granit/types';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * List/search users from the identity provider.
 *
 * @example
 * ```tsx
 * const { data: users } = useProviderUsers({ search: 'john', max: 20 });
 * ```
 */
export function useProviderUsers(
  params?: IdentityProviderUserListParams
): UseQueryResult<readonly IdentityUser[]> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: [...buildIdentityQueryKey(config, 'provider', 'users', 'list'), params],
    queryFn: () => listProviderUsers(config.client, basePath, params),
  });
}

/**
 * Get a single user by ID from the identity provider.
 *
 * The query is automatically disabled when `userId` is empty.
 *
 * @example
 * ```tsx
 * const { data: user } = useProviderUser(selectedUserId);
 * ```
 */
export function useProviderUser(userId: UserId): UseQueryResult<IdentityUser> {
  const config = useIdentityConfig();
  const basePath = config.providerBasePath;

  return useQuery({
    queryKey: buildIdentityQueryKey(config, 'provider', 'users', userId),
    queryFn: () => getProviderUser(config.client, basePath, userId),
    enabled: userId.length > 0,
  });
}

/**
 * Create a new user in the identity provider.
 * Invalidates provider user queries on success.
 *
 * @example
 * ```tsx
 * const createUser = useCreateUser();
 * await createUser.mutateAsync({ username: 'jdoe', email: 'jdoe@example.com', enabled: true });
 * ```
 */
export function useCreateUser(): UseMutationResult<IdentityUser, Error, IdentityUserCreateRequest> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: (request: IdentityUserCreateRequest) =>
      createUser(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}

/** Variables for `useUpdateUser` mutation. */
export type UpdateUserVariables = {
  readonly userId: UserId;
  readonly request: IdentityUserUpdateRequest;
};

/**
 * Update an existing user in the identity provider.
 * Invalidates provider user queries on success.
 *
 * @example
 * ```tsx
 * const updateUser = useUpdateUser();
 * await updateUser.mutateAsync({ userId: 'user-1', request: { email: 'new@example.com' } });
 * ```
 */
export function useUpdateUser(): UseMutationResult<IdentityUser, Error, UpdateUserVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: ({ userId, request }: UpdateUserVariables) =>
      updateUser(config.client, basePath, userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}

/** Variables for `useSetUserEnabled` mutation. */
export type SetUserEnabledVariables = {
  readonly userId: UserId;
  readonly enabled: boolean;
};

/**
 * Enable or disable a user in the identity provider.
 * Invalidates provider user queries on success.
 *
 * @example
 * ```tsx
 * const setEnabled = useSetUserEnabled();
 * await setEnabled.mutateAsync({ userId: 'user-1', enabled: false });
 * ```
 */
export function useSetUserEnabled(): UseMutationResult<void, Error, SetUserEnabledVariables> {
  const config = useIdentityConfig();
  const queryClient = useQueryClient();
  const basePath = config.providerBasePath;

  return useMutation({
    mutationFn: ({ userId, enabled }: SetUserEnabledVariables) =>
      setUserEnabled(config.client, basePath, userId, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildIdentityQueryKey(config, 'provider', 'users'),
      });
    },
  });
}
