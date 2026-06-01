import { deleteExportPreset, listExportPresets, saveExportPreset } from '@granit/data-exchange';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildExportQueryKey, useExportConfig } from '../providers/export-provider';

import type { ExportPresetResponse, SaveExportPresetRequest } from '@granit/data-exchange';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface UseExportPresetsReturn {
  /** Saved presets for the definition. */
  readonly presets: UseQueryResult<readonly ExportPresetResponse[]>;
  /** Mutation to save or update a preset. */
  readonly save: UseMutationResult<void, Error, SaveExportPresetRequest>;
  /** Mutation to delete a preset by name. */
  readonly remove: UseMutationResult<void, Error, string>;
}

/**
 * Hook for CRUD operations on export presets for a given definition.
 */
export function useExportPresets(definitionName: string | undefined): UseExportPresetsReturn {
  const config = useExportConfig();
  const queryClient = useQueryClient();

  const presetsQueryKey = buildExportQueryKey(config, 'presets', definitionName ?? '');

  const presets = useQuery({
    queryKey: presetsQueryKey,
    queryFn: () => listExportPresets(config.client, config.basePath, definitionName!),
    enabled: !!definitionName,
    staleTime: 30 * 1000,
  });

  const save = useMutation({
    mutationFn: (request: SaveExportPresetRequest) =>
      saveExportPreset(config.client, config.basePath, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: presetsQueryKey });
    },
  });

  const remove = useMutation({
    mutationFn: (presetName: string) =>
      deleteExportPreset(config.client, config.basePath, definitionName!, presetName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: presetsQueryKey });
    },
  });

  return { presets, save, remove };
}
