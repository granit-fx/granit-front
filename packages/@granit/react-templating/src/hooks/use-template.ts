import { getTemplate } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templatingKeys } from './query-keys';

export function useTemplate(name: string, culture?: string) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templatingKeys.detail(queryKeyPrefix, name),
    queryFn: () => getTemplate(client, basePath, name, culture),
    enabled: !!name,
  });
}
