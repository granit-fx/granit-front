import {
  createDocumentPublicLink,
  listDocumentPublicLinks,
  revokeDocumentPublicLink,
} from '@granit/documents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type { ResolvedDocumentsConfig } from '../providers/documents-provider';
import type {
  CreatePublicLinkRequest,
  CreatePublicLinkResponse,
  PublicLinkResponse,
  RevokePublicLinkRequest,
} from '@granit/documents';
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

function invalidatePublicLinks(
  queryClient: QueryClient,
  config: ResolvedDocumentsConfig,
  documentId: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'documents', documentId, 'public-links'),
  });
}

/** List active public links for a document. Disabled when `documentId` is empty. */
export function useDocumentPublicLinks(
  documentId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly PublicLinkResponse[]> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', documentId, 'public-links'),
    queryFn: () => listDocumentPublicLinks(config.client, config.basePath, documentId),
    enabled: (options?.enabled ?? true) && documentId.length > 0,
  });
}

interface CreatePublicLinkArgs {
  readonly documentId: string;
  readonly request: CreatePublicLinkRequest;
}

/** Create a public link for a document. Invalidates the public-links list on success. */
export function useCreateDocumentPublicLink(): UseMutationResult<
  CreatePublicLinkResponse,
  Error,
  CreatePublicLinkArgs
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, request }: CreatePublicLinkArgs) =>
      createDocumentPublicLink(config.client, config.basePath, documentId, request),
    onSuccess: (_data, { documentId }) => {
      invalidatePublicLinks(queryClient, config, documentId);
    },
  });
}

interface RevokePublicLinkArgs {
  readonly id: string;
  readonly documentId: string;
  readonly request: RevokePublicLinkRequest;
}

/** Revoke a public link. Invalidates the public-links list for the parent document on success. */
export function useRevokeDocumentPublicLink(): UseMutationResult<
  void,
  Error,
  RevokePublicLinkArgs
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: RevokePublicLinkArgs) =>
      revokeDocumentPublicLink(config.client, config.basePath, id, request),
    onSuccess: (_data, { documentId }) => {
      invalidatePublicLinks(queryClient, config, documentId);
    },
  });
}
