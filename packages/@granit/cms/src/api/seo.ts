import type { EffectiveSeoResponse } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetches the cascade-resolved, render-ready SEO for a content item.
 * `GET {basePath}/api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}/effective`
 *
 * `contentTitle` and `contentDescription` seed the cascade when no explicit
 * title/description row exists for the content item.
 */
export async function getEffectiveSeo(
  client: AxiosInstance,
  basePath: string,
  params: {
    siteId: string;
    contentType: string;
    contentId: string;
    culture: string;
    contentTitle?: string;
    contentDescription?: string;
  }
): Promise<EffectiveSeoResponse> {
  const { siteId, contentType, contentId, culture, contentTitle, contentDescription } = params;
  const response = await client.get<EffectiveSeoResponse>(
    `${basePath}/api/cms/seo/sites/${siteId}/metadata/${contentType}/${contentId}/${culture}/effective`,
    { params: { contentTitle, contentDescription } }
  );
  return response.data;
}
