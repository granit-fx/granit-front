import { buildApiUrl } from '@granit/api-client';

import type {
  SaveTemplateCategoryRequest,
  SaveTemplateRequest,
  TemplateCategory,
  TemplateDetail,
  TemplateHistory,
  TemplateLifecycle,
  TemplateListItem,
  TemplateListParams,
  TemplatePreviewRequest,
  TemplatePreviewResponse,
  TemplateRevision,
  TemplateVariables,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, PaginationParams } from '@granit/query-engine';

function templateUrl(basePath: string, name: string, ...segments: string[]): string {
  return buildApiUrl(basePath, 'templates', encodeURIComponent(name), ...segments);
}

// ---------------------------------------------------------------------------
// Templates CRUD
// ---------------------------------------------------------------------------

export async function getTemplates(
  client: AxiosInstance,
  basePath: string,
  params?: TemplateListParams
): Promise<PagedResult<TemplateListItem>> {
  const { data } = await client.get<PagedResult<TemplateListItem>>(`${basePath}/templates`, {
    params,
  });
  return data;
}

export async function getTemplate(
  client: AxiosInstance,
  basePath: string,
  name: string,
  culture?: string
): Promise<TemplateDetail> {
  const { data } = await client.get<TemplateDetail>(templateUrl(basePath, name), {
    params: { culture },
  });
  return data;
}

export async function saveDraft(
  client: AxiosInstance,
  basePath: string,
  request: SaveTemplateRequest
): Promise<TemplateDetail> {
  const { data } = await client.post<TemplateDetail>(`${basePath}/templates`, request);
  return data;
}

export async function updateDraft(
  client: AxiosInstance,
  basePath: string,
  name: string,
  request: SaveTemplateRequest
): Promise<TemplateDetail> {
  const { data } = await client.put<TemplateDetail>(templateUrl(basePath, name), request);
  return data;
}

export async function deleteDraft(
  client: AxiosInstance,
  basePath: string,
  name: string,
  culture?: string
): Promise<void> {
  await client.delete(templateUrl(basePath, name, 'draft'), { params: { culture } });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function publishTemplate(
  client: AxiosInstance,
  basePath: string,
  name: string,
  culture?: string
): Promise<TemplateDetail> {
  const { data } = await client.post<TemplateDetail>(templateUrl(basePath, name, 'publish'), null, {
    params: { culture },
  });
  return data;
}

export async function unpublishTemplate(
  client: AxiosInstance,
  basePath: string,
  name: string,
  culture?: string
): Promise<void> {
  await client.post(templateUrl(basePath, name, 'unpublish'), null, { params: { culture } });
}

export async function getLifecycleInfo(
  client: AxiosInstance,
  basePath: string,
  name: string,
  culture?: string
): Promise<TemplateLifecycle> {
  const { data } = await client.get<TemplateLifecycle>(templateUrl(basePath, name, 'lifecycle'), {
    params: { culture },
  });
  return data;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export async function getHistory(
  client: AxiosInstance,
  basePath: string,
  name: string,
  params?: PaginationParams & { culture?: string }
): Promise<TemplateHistory> {
  const { data } = await client.get<TemplateHistory>(templateUrl(basePath, name, 'history'), {
    params,
  });
  return data;
}

export async function getRevision(
  client: AxiosInstance,
  basePath: string,
  name: string,
  revisionId: string
): Promise<TemplateRevision> {
  const { data } = await client.get<TemplateRevision>(
    templateUrl(basePath, name, 'history', revisionId)
  );
  return data;
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export async function previewTemplate(
  client: AxiosInstance,
  basePath: string,
  name: string,
  request: TemplatePreviewRequest
): Promise<TemplatePreviewResponse> {
  const { data } = await client.post<TemplatePreviewResponse>(
    templateUrl(basePath, name, 'preview'),
    request
  );
  return data;
}

export async function previewTemplateBinary(
  client: AxiosInstance,
  basePath: string,
  name: string,
  request: TemplatePreviewRequest
): Promise<Blob> {
  const { data } = await client.post<Blob>(templateUrl(basePath, name, 'preview'), request, {
    responseType: 'blob',
  });
  return data;
}

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

export async function getVariables(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<TemplateVariables> {
  const { data } = await client.get<TemplateVariables>(templateUrl(basePath, name, 'variables'));
  return data;
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

export async function getLayouts(client: AxiosInstance, basePath: string): Promise<string[]> {
  const { data } = await client.get<string[]>(`${basePath}/layouts`);
  return data;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(
  client: AxiosInstance,
  basePath: string
): Promise<TemplateCategory[]> {
  const { data } = await client.get<TemplateCategory[]>(`${basePath}/categories`);
  return data;
}

export async function createCategory(
  client: AxiosInstance,
  basePath: string,
  request: SaveTemplateCategoryRequest
): Promise<TemplateCategory> {
  const { data } = await client.post<TemplateCategory>(`${basePath}/categories`, request);
  return data;
}

export async function updateCategory(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: SaveTemplateCategoryRequest
): Promise<TemplateCategory> {
  const { data } = await client.put<TemplateCategory>(
    `${basePath}/categories/${encodeURIComponent(id)}`,
    request
  );
  return data;
}

export async function deleteCategory(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/categories/${encodeURIComponent(id)}`);
}
