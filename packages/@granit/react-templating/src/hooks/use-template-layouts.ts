import { getLayouts } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider.js';

import { templateKeys } from './query-keys.js';

export function useTemplateLayouts() {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templateKeys.layouts(queryKeyPrefix),
    queryFn: () => getLayouts(client, basePath),
    staleTime: 5 * 60 * 1000,
  });
}
