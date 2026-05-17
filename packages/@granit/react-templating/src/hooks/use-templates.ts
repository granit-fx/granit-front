import { getTemplates } from '@granit/templating';
import { useQuery } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider.js';

import { templateKeys } from './query-keys.js';

import type { TemplateListParams } from '@granit/templating';

export function useTemplates(params?: TemplateListParams) {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templateKeys.list(queryKeyPrefix, params ?? {}),
    queryFn: () => getTemplates(client, basePath, params),
  });
}
