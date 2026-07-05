'use client';

import { createConfigProvider } from '@granit/react-api-client';

import { CMS_BASE_PATH, DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

export interface BlogConfig extends GranitProviderConfig {
  /** Query-key namespace for this provider instance. Defaults to `['blog']`. */
  readonly queryKeyPrefix?: readonly string[];
  /**
   * Base path of the CMS block-data endpoint used to resolve data-bound blocks
   * (the blog-latest-posts block posts to `{cmsBasePath}/blocks/data`).
   * Defaults to `/api/cms`.
   */
  readonly cmsBasePath?: string;
}

export interface ResolvedBlogConfig extends BlogConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
  readonly cmsBasePath: string;
}

export type BlogProviderProps = GranitProviderProps<BlogConfig>;

const { Provider, useConfig } = createConfigProvider<BlogConfig, ResolvedBlogConfig>({
  name: 'Blog',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    cmsBasePath: base.cmsBasePath ?? CMS_BASE_PATH,
  }),
});

export const BlogProvider = Provider;
export const useBlogConfig = useConfig;
