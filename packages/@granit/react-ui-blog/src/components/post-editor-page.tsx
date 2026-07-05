import { extractBlogConflict, usePost } from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Separator,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@granit/react-ui';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import { PostConflictDialog } from './post-conflict-dialog';
import { PostContentEditor } from './post-content-editor';
import { PostGalleryEditor } from './post-gallery-editor';
import { PostLifecyclePanel } from './post-lifecycle-panel';
import { PostMetadataForm } from './post-metadata-form';

import type { BlogPostResponse } from '@granit/blog';
import type { BlogConflict } from '@granit/react-blog';

/** Default authoring cultures — override via `cultures` with the site's allowed set. */
const DEFAULT_CULTURES = ['en', 'fr'] as const;

export interface PostEditorPageProps {
  /** Post id in edit mode; omit for the create flow (host owns routing). */
  readonly postId?: string;
  /** Site id for the create flow (an existing post derives it from itself). */
  readonly siteId?: string;
  /** Cultures the post can be authored in. Defaults to `['en', 'fr']`. */
  readonly cultures?: readonly string[];
  /** Back to the list. */
  readonly onBack?: () => void;
  /** Called after a save with the created/updated post (host navigates to edit). */
  readonly onSaved?: (post: BlogPostResponse) => void;
}

/**
 * Post authoring surface. In create mode only the metadata form is shown; once
 * created the host navigates (via `onSaved`) to the edit surface where content
 * (per-culture Puck editor), media gallery and lifecycle tabs become available.
 * `409` conflicts anywhere raise a shared reload prompt.
 */
export function PostEditorPage({
  postId,
  siteId,
  cultures = DEFAULT_CULTURES,
  onBack,
  onSaved,
}: PostEditorPageProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(postId);
  const qc = useQueryClient();
  const { data: post, isLoading } = usePost(postId ?? '', { enabled: isEdit });
  const [conflict, setConflict] = useState<BlogConflict | null>(null);

  function handleConflict(error: unknown) {
    const parsed = extractBlogConflict(error);
    if (parsed) setConflict(parsed);
  }

  function reload() {
    if (postId) void qc.invalidateQueries({ queryKey: ['blog', 'posts', postId] });
  }

  const header = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={() => onBack?.()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('blog:Posts.Title', 'Posts')}
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <h2 className="text-2xl font-semibold text-foreground">
        {isEdit ? t('blog:Posts.EditTitle', 'Edit post') : t('blog:Posts.CreateTitle', 'New post')}
      </h2>
    </div>
  );

  if (!isEdit) {
    return (
      <div data-slot="blog-post-editor-page" className="space-y-6">
        {header}
        <PostMetadataForm siteId={siteId ?? ''} onSaved={onSaved} onCancel={onBack} />
      </div>
    );
  }

  if (isLoading || !post) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        {t('blog:Common.Loading', 'Loading…')}
      </div>
    );
  }

  return (
    <div data-slot="blog-post-editor-page" className="space-y-6">
      {header}

      <Tabs defaultValue="metadata">
        <TabsList>
          <TabsTrigger value="metadata">{t('blog:Tabs.Metadata', 'Metadata')}</TabsTrigger>
          <TabsTrigger value="content">{t('blog:Tabs.Content', 'Content')}</TabsTrigger>
          <TabsTrigger value="media">{t('blog:Tabs.Media', 'Media')}</TabsTrigger>
          <TabsTrigger value="lifecycle">{t('blog:Tabs.Lifecycle', 'Lifecycle')}</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="pt-4">
          <PostMetadataForm
            siteId={post.siteId}
            post={post}
            onConflict={handleConflict}
            onCancel={onBack}
          />
        </TabsContent>
        <TabsContent value="content" className="pt-4">
          <PostContentEditor post={post} cultures={cultures} onConflict={handleConflict} />
        </TabsContent>
        <TabsContent value="media" className="pt-4">
          <PostGalleryEditor post={post} />
        </TabsContent>
        <TabsContent value="lifecycle" className="pt-4">
          <PostLifecyclePanel post={post} />
        </TabsContent>
      </Tabs>

      <PostConflictDialog
        conflict={conflict}
        onReload={reload}
        onDismiss={() => setConflict(null)}
      />
    </div>
  );
}
