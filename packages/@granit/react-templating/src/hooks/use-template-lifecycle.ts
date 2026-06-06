import { getLifecycleInfo } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templateKeys } from './query-keys';

export function useTemplateLifecycle(name: string, culture?: string) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templateKeys.lifecycle(queryKeyPrefix, name),
    queryFn: () => getLifecycleInfo(client, basePath, name, culture),
    enabled: !!name,
  });
}
