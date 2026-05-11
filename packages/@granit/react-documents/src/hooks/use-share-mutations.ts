import { grantDocumentShare, grantFolderShare, revokeShare } from '@granit/documents';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider.js';

import type { ResolvedDocumentsConfig } from '../providers/documents-provider.js';
import type { GrantShareRequest, ShareResponse } from '@granit/documents';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

interface GrantFolderShareArgs {
  readonly folderId: string;
  readonly request: GrantShareRequest;
}

interface GrantDocumentShareArgs {
  readonly documentId: string;
  readonly request: GrantShareRequest;
}

function invalidateAllShares(queryClient: QueryClient, config: ResolvedDocumentsConfig): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'shares'),
  });
}

/** Grant a share on a folder. */
export function useGrantFolderShare(): UseMutationResult<
  ShareResponse,
  Error,
  GrantFolderShareArgs
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, request }: GrantFolderShareArgs) =>
      grantFolderShare(config.client, config.basePath, folderId, request),
    onSuccess: () => {
      invalidateAllShares(queryClient, config);
    },
  });
}

/** Grant a share on a document. */
export function useGrantDocumentShare(): UseMutationResult<
  ShareResponse,
  Error,
  GrantDocumentShareArgs
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, request }: GrantDocumentShareArgs) =>
      grantDocumentShare(config.client, config.basePath, documentId, request),
    onSuccess: () => {
      invalidateAllShares(queryClient, config);
    },
  });
}

/**
 * Revoke a share by id. Share ids are tenant-global, so we cannot pinpoint
 * the impacted folder/document without an extra lookup — invalidate the
 * whole shares namespace.
 */
export function useRevokeShare(): UseMutationResult<void, Error, string> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeShare(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateAllShares(queryClient, config);
    },
  });
}
