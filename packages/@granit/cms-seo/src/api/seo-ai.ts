import type {
  SeoSuggestionApplyRequest,
  ListSeoSuggestionsParams,
  SeoSuggestionRejectRequest,
  SeoSuggestRequest,
  SeoSuggestResponse,
  SeoSuggestionResponse,
  SeoSuggestionDiffResponse,
  SeoSuggestionListResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * `POST /api/cms/seo/ai/suggest` — request a suggestion for a content item.
 * Idempotent: the same fingerprint within 7 days reuses the existing suggestion.
 * Requires `Cms.Seo.AI.Generate`.
 */
export async function suggestSeo(
  client: AxiosInstance,
  basePath: string,
  request: SeoSuggestRequest
): Promise<SeoSuggestResponse> {
  const res = await client.post<SeoSuggestResponse>(`${basePath}/ai/suggest`, request);
  return res.data;
}

/** `GET /api/cms/seo/ai/suggestions` — paged inbox (skip/take). Requires `Cms.Seo.AI.Read`. */
export async function listSeoSuggestions(
  client: AxiosInstance,
  basePath: string,
  params?: ListSeoSuggestionsParams
): Promise<SeoSuggestionListResponse> {
  const res = await client.get<SeoSuggestionListResponse>(`${basePath}/ai/suggestions`, { params });
  return res.data;
}

/** `GET /api/cms/seo/ai/suggestions/{id}/diff` — per-field current vs proposed. Requires `Cms.Seo.AI.Read`. */
export async function getSeoSuggestionDiff(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<SeoSuggestionDiffResponse> {
  const res = await client.get<SeoSuggestionDiffResponse>(
    `${basePath}/ai/suggestions/${encodeURIComponent(id)}/diff`
  );
  return res.data;
}

/**
 * `POST /api/cms/seo/ai/suggestions/{id}/apply` — apply a subset of fields.
 * `request.fields` is the flags string (e.g. `"Title, Description"`).
 * Requires `Cms.Seo.AI.Apply`.
 */
export async function applySeoSuggestion(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: SeoSuggestionApplyRequest
): Promise<SeoSuggestionResponse> {
  const res = await client.post<SeoSuggestionResponse>(
    `${basePath}/ai/suggestions/${encodeURIComponent(id)}/apply`,
    request
  );
  return res.data;
}

/** `POST /api/cms/seo/ai/suggestions/{id}/reject`. Requires `Cms.Seo.AI.Apply`. */
export async function rejectSeoSuggestion(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request?: SeoSuggestionRejectRequest
): Promise<SeoSuggestionResponse> {
  const res = await client.post<SeoSuggestionResponse>(
    `${basePath}/ai/suggestions/${encodeURIComponent(id)}/reject`,
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
  await client.post(`${basePath}/ai/sites/${encodeURIComponent(siteId)}/audit`, null, {
    validateStatus: (s) => s === 202,
  });
}
