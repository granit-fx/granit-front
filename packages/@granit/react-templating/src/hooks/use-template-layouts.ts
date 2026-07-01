import { getLayouts } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templatingKeys } from './query-keys';

export function useTemplateLayouts() {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templatingKeys.layouts(queryKeyPrefix),
    queryFn: () => getLayouts(client, basePath),
    staleTime: 5 * 60 * 1000,
  });
}
