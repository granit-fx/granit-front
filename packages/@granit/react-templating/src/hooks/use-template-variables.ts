import { getVariables } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templatingKeys } from './query-keys';

export function useTemplateVariables(name: string) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templatingKeys.variables(queryKeyPrefix, name),
    queryFn: () => getVariables(client, basePath, name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}
