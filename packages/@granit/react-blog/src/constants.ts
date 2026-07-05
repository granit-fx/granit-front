export const DEFAULT_BASE_PATH = '/api/blog';
export const DEFAULT_QUERY_KEY_PREFIX = ['blog'] as const;

/** Base path of the CMS block-data endpoint (`POST {CMS_BASE_PATH}/blocks/data`). */
export const CMS_BASE_PATH = '/api/cms';

/** The data-source key the backend registers for the blog-latest-posts block. */
export const BLOG_LATEST_POSTS_DATA_SOURCE_KEY = 'blog.latest-posts';

/** Puck block name for the latest-posts block. */
export const BLOG_LATEST_POSTS_BLOCK_NAME = 'blog-latest-posts';
