import type { PageSearchPageResponse, PageSearchParams } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Public, site-scoped page search (anonymous).
 * `GET {basePath}/search?q={q}&culture={culture}&page=&pageSize=`
 * + `X-Granit-Site: {siteId}` header — only the current site's pages are returned.
 */
export async function searchPages(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  params: PageSearchParams
): Promise<PageSearchPageResponse> {
  const res = await client.get<PageSearchPageResponse>(`${basePath}/search`, {
    params: {
      q: params.q,
      culture: params.culture,
      ...(params.page === undefined ? {} : { page: params.page }),
      ...(params.pageSize === undefined ? {} : { pageSize: params.pageSize }),
    },
    headers: { 'X-Granit-Site': siteId },
  });
  return res.data;
}

/**
 * Admin page search across every site the caller's tenant owns.
 * `GET {basePath}/pages/search?q={q}&culture={culture}&page=&pageSize=`
 * Requires `Cms.Pages.Read`. No site filter — admin search spans the whole CMS.
 */
export async function searchPagesAdmin(
  client: AxiosInstance,
  basePath: string,
  params: PageSearchParams
): Promise<PageSearchPageResponse> {
  const res = await client.get<PageSearchPageResponse>(`${basePath}/pages/search`, {
    params: {
      q: params.q,
      culture: params.culture,
      ...(params.page === undefined ? {} : { page: params.page }),
      ...(params.pageSize === undefined ? {} : { pageSize: params.pageSize }),
    },
  });
  return res.data;
}
