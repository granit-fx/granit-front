'use client';

import { Render } from '@puckeditor/core';

import { logger } from '../logger';

import type { Config, Data } from '@puckeditor/core';

export interface BlogPostBodyProps {
  /** The opaque Puck block-tree JSON (`contentJson`) from a published post. */
  readonly contentJson: string;
  /**
   * Puck config for rendering — build it with `@granit/react-cms`'s
   * `catalogToConfig`, then `registerBlogBlocks` to add blog blocks.
   */
  readonly config: Config;
}

/**
 * Renders a post body from its `contentJson` using the shared CMS Puck renderer
 * and block catalog. There is intentionally no second renderer — the same
 * `<Render>` + config that draws CMS pages draws post bodies (incl. rich-text).
 */
export function BlogPostBody({ contentJson, config }: BlogPostBodyProps) {
  let data: Data | null = null;
  try {
    data = JSON.parse(contentJson) as Data;
  } catch (err: unknown) {
    logger.warn('Invalid post contentJson; skipping body render', { err });
  }

  if (!data) return null;

  return (
    <div data-block="blog-post-body">
      <Render config={config} data={data} />
    </div>
  );
}
