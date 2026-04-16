import type { ExportPresetResponse, SaveExportPresetRequest } from '../types/export-preset.js';
import type { AxiosInstance } from 'axios';

/**
 * Lists saved export presets for a given definition.
 *
 * `GET {basePath}/metadata/presets/{definitionName}`
 */
export async function listExportPresets(
  client: AxiosInstance,
  basePath: string,
  definitionName: string
): Promise<readonly ExportPresetResponse[]> {
  const response = await client.get<ExportPresetResponse[]>(
    `${basePath}/metadata/presets/${encodeURIComponent(definitionName)}`
  );
  return response.data;
}

/**
 * Saves or updates an export preset.
 *
 * `POST {basePath}/metadata/presets`
 */
export async function saveExportPreset(
  client: AxiosInstance,
  basePath: string,
  request: SaveExportPresetRequest
): Promise<void> {
  await client.post(`${basePath}/metadata/presets`, request);
}

/**
 * Deletes a saved export preset.
 *
 * `DELETE {basePath}/metadata/presets/{definitionName}/{presetName}`
 */
export async function deleteExportPreset(
  client: AxiosInstance,
  basePath: string,
  definitionName: string,
  presetName: string
): Promise<void> {
  await client.delete(
    `${basePath}/metadata/presets/${encodeURIComponent(definitionName)}/${encodeURIComponent(presetName)}`
  );
}
