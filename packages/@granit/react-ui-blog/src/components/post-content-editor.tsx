import { getBlockCatalog } from '@granit/cms';
import { registerBlogBlocks, useSaveDraftContent } from '@granit/react-blog';
import { catalogToConfig, useCmsConfig } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import {
  toast,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from '@granit/react-ui';
import { Puck } from '@puckeditor/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import type { BlogPostResponse } from '@granit/blog';
import type { Config, Data } from '@puckeditor/core';

const EMPTY_DATA = { content: [], root: { props: {} } } as unknown as Data;

export interface PostContentEditorProps {
  readonly post: BlogPostResponse;
  /** Cultures the post can be authored in (the site's allowed cultures). */
  readonly cultures: readonly string[];
  /** Called with the rejected error when a draft save hits a `409`. */
  readonly onConflict?: (error: unknown) => void;
}

/**
 * Per-culture draft authoring with the embedded Puck editor. The Puck config is
 * built from the shared CMS block catalog (`catalogToConfig`) and augmented with
 * the blog blocks (`registerBlogBlocks`) — the same catalog CMS pages use, no
 * second editor. Saving posts `PUT /posts/{id}/content` with the post's
 * `concurrencyStamp`; a `409` (`DraftConcurrency` / `StalePost`) is surfaced
 * through `onConflict`.
 */
export function PostContentEditor({ post, cultures, onConflict }: PostContentEditorProps) {
  const { t } = useTranslation();
  const { client, basePath } = useCmsConfig();
  const saveDraft = useSaveDraftContent();

  const [culture, setCulture] = useState(cultures[0] ?? 'en');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const catalogQuery = useQuery({
    queryKey: ['blog', 'editor', 'catalog', basePath],
    queryFn: () => getBlockCatalog(client, basePath),
    staleTime: Infinity,
  });

  const config = useMemo<Config | null>(() => {
    if (!catalogQuery.data) return null;
    // Editor surface: no `resolveBlockData` — live data is not pre-resolved while editing.
    return registerBlogBlocks(catalogToConfig(catalogQuery.data));
  }, [catalogQuery.data]);

  function handleSave(data: Data) {
    saveDraft.mutate(
      {
        id: post.id,
        request: {
          culture,
          contentJson: JSON.stringify(data),
          title,
          summary: summary || null,
          concurrencyStamp: post.concurrencyStamp,
        },
      },
      {
        onSuccess: () => toast.success(t('blog:Content.SaveSuccess', 'Draft saved.')),
        onError: (error) => onConflict?.(error),
      }
    );
  }

  return (
    <div data-slot="post-content-editor" className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="draft-culture">{t('blog:Content.Culture', 'Culture')}</Label>
          <Select value={culture} onValueChange={setCulture}>
            <SelectTrigger id="draft-culture" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cultures.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="draft-title">{t('blog:Content.Fields.Title', 'Title')}</Label>
          <Input id="draft-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="draft-summary">{t('blog:Content.Fields.Summary', 'Summary')}</Label>
        <Textarea
          id="draft-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
        />
      </div>

      {catalogQuery.isError && (
        <p className="text-sm text-destructive">
          {t('blog:Content.CatalogError', 'Failed to load the block catalog.')}
        </p>
      )}

      {!config ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          {t('blog:Content.LoadingEditor', 'Loading editor…')}
        </div>
      ) : (
        <div data-slot="puck-editor" className="rounded-md border">
          <Puck config={config} data={EMPTY_DATA} onPublish={handleSave} />
        </div>
      )}
    </div>
  );
}
