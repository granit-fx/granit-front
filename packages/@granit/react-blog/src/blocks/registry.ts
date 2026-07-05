import { BLOG_LATEST_POSTS_BLOCK_NAME } from '../constants';

import { BlogLatestPostsBlock } from './blog-latest-posts-block';

import type { ComponentType } from 'react';

/**
 * Blog block components keyed by catalog `name`, mirroring `BLOCK_COMPONENTS`
 * in `@granit/react-cms`. Merged into the Puck config by `registerBlogBlocks`
 * so the shared renderer can draw blog blocks embedded in CMS pages.
 */
export const BLOG_BLOCK_COMPONENTS: Readonly<Record<string, ComponentType<never>>> = {
  [BLOG_LATEST_POSTS_BLOCK_NAME]: BlogLatestPostsBlock as ComponentType<never>,
};
