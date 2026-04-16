import { listExportDefinitions, getExportFields } from '@granit/data-exchange';
import { useQuery } from '@tanstack/react-query';

import { buildExportQueryKey, useExportConfig } from '../providers/export-provider.js';

import type { ExportDefinitionResponse, ExportField } from '@granit/data-exchange';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches all registered export definitions.
 */
export function useExportDefinitions(): UseQueryResult<readonly ExportDefinitionResponse[]> {
  const config = useExportConfig();

  return useQuery({
    queryKey: buildExportQueryKey(config, 'definitions'),
    queryFn: () => listExportDefinitions(config.client, config.basePath),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches the available fields for a given export definition.
 */
export function useExportFields(
  definitionName: string | undefined
): UseQueryResult<readonly ExportField[]> {
  const config = useExportConfig();

  return useQuery({
    queryKey: buildExportQueryKey(config, 'fields', definitionName ?? ''),
    queryFn: () => getExportFields(config.client, config.basePath, definitionName!),
    enabled: !!definitionName,
    staleTime: 5 * 60 * 1000,
  });
}
