import { listTemplates } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templatingKeys } from './query-keys';

import type { TemplateListParams } from '@granit/templating';

export function useTemplates(params?: TemplateListParams) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templatingKeys.list(queryKeyPrefix, params ?? {}),
    queryFn: () => listTemplates(client, basePath, params),
  });
}
