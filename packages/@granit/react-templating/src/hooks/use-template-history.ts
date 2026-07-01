import { getHistory, getRevision } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templatingKeys } from './query-keys';

export function useTemplateHistory(
  name: string,
  params?: { culture?: string; page?: number; pageSize?: number }
) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: [...templatingKeys.history(queryKeyPrefix, name), params],
    queryFn: () => getHistory(client, basePath, name, params),
    enabled: !!name,
  });
}

export function useTemplateRevision(name: string, revisionId: string) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templatingKeys.revision(queryKeyPrefix, name, revisionId),
    queryFn: () => getRevision(client, basePath, name, revisionId),
    enabled: !!name && !!revisionId,
  });
}
