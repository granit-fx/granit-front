import { getHistory, getRevision } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider.js';

import { templateKeys } from './query-keys.js';

export function useTemplateHistory(
  name: string,
  params?: { culture?: string; page?: number; pageSize?: number }
) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: [...templateKeys.history(queryKeyPrefix, name), params],
    queryFn: () => getHistory(client, basePath, name, params),
    enabled: !!name,
  });
}

export function useTemplateRevision(name: string, revisionId: string) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templateKeys.revision(queryKeyPrefix, name, revisionId),
    queryFn: () => getRevision(client, basePath, name, revisionId),
    enabled: !!name && !!revisionId,
  });
}
