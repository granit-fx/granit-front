import type {
  ApplySeoAiRequest,
  PagedResponse,
  RejectSeoAiRequest,
  SeoAiSuggestRequest,
  SeoAiSuggestResponse,
  SeoAiSuggestionResponse,
  SeoAiSuggestionStatus,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

export interface ListSeoSuggestionsParams {
  readonly siteId?: string;
  readonly contentType?: string;
  readonly status?: SeoAiSuggestionStatus;
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * `POST /api/cms/seo/ai/suggest` — request a suggestion for a content item.
 * Idempotent: the same content within 7 days reuses the existing suggestion.
 * Requires `Cms.Seo.AI.Generate`.
 */
export async function suggestSeo(
  client: AxiosInstance,
  basePath: string,
  request: SeoAiSuggestRequest
): Promise<SeoAiSuggestResponse> {
  const res = await client.post<SeoAiSuggestResponse>(
    `${basePath}/api/cms/seo/ai/suggest`,
    request
  );
  return res.data;
}

/** `GET /api/cms/seo/ai/suggestions` — paged inbox. Requires `Cms.Seo.AI.Read`. */
export async function listSeoSuggestions(
  client: AxiosInstance,
  basePath: string,
  params?: ListSeoSuggestionsParams
): Promise<PagedResponse<SeoAiSuggestionResponse>> {
  const res = await client.get<PagedResponse<SeoAiSuggestionResponse>>(
    `${basePath}/api/cms/seo/ai/suggestions`,
    { params }
  );
  return res.data;
}

/** `GET /api/cms/seo/ai/suggestions/{id}/diff` — per-field current vs proposed. Requires `Cms.Seo.AI.Read`. */
export async function getSeoSuggestionDiff(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<SeoAiSuggestionResponse> {
  const res = await client.get<SeoAiSuggestionResponse>(
    `${basePath}/api/cms/seo/ai/suggestions/${encodeURIComponent(id)}/diff`
  );
  return res.data;
}

/**
 * `POST /api/cms/seo/ai/suggestions/{id}/apply` — apply a subset of fields.
 * Requires `Cms.Seo.AI.Apply`.
 */
export async function applySeoSuggestion(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: ApplySeoAiRequest
): Promise<SeoAiSuggestionResponse> {
  const res = await client.post<SeoAiSuggestionResponse>(
    `${basePath}/api/cms/seo/ai/suggestions/${encodeURIComponent(id)}/apply`,
    request
  );
  return res.data;
}

/** `POST /api/cms/seo/ai/suggestions/{id}/reject`. Requires `Cms.Seo.AI.Apply`. */
export async function rejectSeoSuggestion(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request?: RejectSeoAiRequest
): Promise<SeoAiSuggestionResponse> {
  const res = await client.post<SeoAiSuggestionResponse>(
    `${basePath}/api/cms/seo/ai/suggestions/${encodeURIComponent(id)}/reject`,
    request ?? {}
  );
  return res.data;
}

/**
 * `POST /api/cms/seo/ai/sites/{siteId}/audit` — bulk suggestion generation (202 accepted).
 * Requires `Cms.Seo.AI.Generate`.
 */
export async function triggerBulkSeoAudit(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<void> {
  await client.post(`${basePath}/api/cms/seo/ai/sites/${encodeURIComponent(siteId)}/audit`, null, {
    validateStatus: (s) => s === 202,
  });
}
