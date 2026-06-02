import { listRedirects } from '@granit/cms-redirects';
import { useQuery } from '@tanstack/react-query';

import { useCmsRedirectsConfig } from '../providers/cms-redirects-provider';

import { cmsRedirectsKeys } from './query-keys';

import type { ListRedirectsParams, PagedResponse, RedirectResponse } from '@granit/cms-redirects';
import type { UseQueryResult } from '@tanstack/react-query';

export function useRedirects(
  params?: ListRedirectsParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResponse<RedirectResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.list(queryKeyPrefix, params?.siteId),
    queryFn: () => listRedirects(client, basePath, params),
    enabled: options?.enabled ?? true,
  });
}
