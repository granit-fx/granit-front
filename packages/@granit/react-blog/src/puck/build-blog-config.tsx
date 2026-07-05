import { BlogLatestPostsBlock } from '../blocks/blog-latest-posts-block';
import { BLOG_LATEST_POSTS_BLOCK_NAME, BLOG_LATEST_POSTS_DATA_SOURCE_KEY } from '../constants';
import { logger } from '../logger';

import type { ResolveBlockDataFn } from '@granit/react-cms';
import type { Config } from '@puckeditor/core';

export interface RegisterBlogBlocksOptions {
  /**
   * When provided, the blog-latest-posts block gets a `resolveData` that calls
   * the shared CMS block-data resolver at SSR time. Omit on the editor surface.
   */
  resolveBlockData?: ResolveBlockDataFn;
  /** Site identifier forwarded to the data resolver. */
  siteId?: string;
  /** BCP-47 culture forwarded to the data resolver. */
  culture?: string;
  /** Puck sidebar category the block appears under. Defaults to `Blog`. */
  category?: string;
}

/**
 * Registers the blog blocks into an existing Puck `Config` (built by
 * `@granit/react-cms`'s `catalogToConfig`). This composes with the shared CMS
 * renderer rather than duplicating it — the blog-latest-posts component is added
 * to the config's `components`/`categories`, and (when `resolveBlockData` is
 * supplied) wired to the `blog.latest-posts` data source via Puck's `resolveData`.
 */
export function registerBlogBlocks(
  baseConfig: Config,
  options: RegisterBlogBlocksOptions = {}
): Config {
  const category = options.category ?? 'Blog';

  const componentConfig: Config['components'][string] = {
    label: 'Latest posts',
    fields: {
      heading: { type: 'text' },
      count: { type: 'number' },
      layout: {
        type: 'select',
        options: [
          { label: 'Grid', value: 'Grid' },
          { label: 'List', value: 'List' },
        ],
      },
    },
    defaultProps: { heading: '', count: 3, layout: 'Grid' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (props: any) => <BlogLatestPostsBlock {...props} />,
  };

  if (options.resolveBlockData) {
    const resolveFn = options.resolveBlockData;
    const siteId = options.siteId ?? '';
    const culture = options.culture ?? '';

    componentConfig.resolveData = async (data) => {
      try {
        const result = await resolveFn({
          dataSourceKey: BLOG_LATEST_POSTS_DATA_SOURCE_KEY,
          query: null,
          siteId,
          culture,
        });
        const resolved = (result.data ?? {}) as { posts?: unknown };
        return {
          props: { ...(data.props as Record<string, unknown>), posts: resolved.posts ?? [] },
          readOnly: { posts: true },
        };
      } catch (err: unknown) {
        logger.warn('blog-latest-posts data resolution failed; rendering with editor props', {
          err,
        });
        return { props: data.props as Record<string, unknown> };
      }
    };
  }

  const existing = (baseConfig.categories?.[category]?.components as string[] | undefined) ?? [];

  return {
    ...baseConfig,
    components: {
      ...baseConfig.components,
      [BLOG_LATEST_POSTS_BLOCK_NAME]: componentConfig,
    },
    categories: {
      ...baseConfig.categories,
      [category]: {
        title: category,
        components: [...existing, BLOG_LATEST_POSTS_BLOCK_NAME],
      },
    },
  };
}
