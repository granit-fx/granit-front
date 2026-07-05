import { blogConstraints } from '@granit/blog';
import { useAuthors, useCreatePost, useUpdatePost } from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import {
  toast,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { DocumentPickerButton } from './document-picker-button';

import type { BlogPostResponse } from '@granit/blog';

interface PostMetadataValues {
  slug: string;
  authorId: string;
  coverImageDocumentId: string | null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface PostMetadataFormProps {
  readonly siteId: string;
  readonly post?: BlogPostResponse;
  /** Called with the rejected error when an edit hits a `409` (stale stamp / slug). */
  readonly onConflict?: (error: unknown) => void;
  /** Called after a successful save with the created/updated post. Host navigates. */
  readonly onSaved?: (post: BlogPostResponse) => void;
  /** Called when the user cancels. */
  readonly onCancel?: () => void;
}

/**
 * Create/edit a post's metadata (slug, author, cover image). On create the post
 * shell is minted and the editor navigates to its edit route (where content,
 * gallery and lifecycle become available). On edit the `concurrencyStamp` is
 * echoed back; a `409` is surfaced through `onConflict` (reload prompt).
 */
export function PostMetadataForm({
  siteId,
  post,
  onConflict,
  onSaved,
  onCancel,
}: PostMetadataFormProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(post);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const { data: authors } = useAuthors(siteId, { enabled: siteId.length > 0 });

  const formResolver = createConstraintsResolver(
    isEdit ? blogConstraints.BlogPostUpdateRequest : blogConstraints.BlogPostCreateRequest,
    t,
    { labelResolver: (field) => t(`blog:Posts.Fields.${capitalize(field)}`, field) }
  ) as unknown as Resolver<PostMetadataValues>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PostMetadataValues>({
    resolver: formResolver,
    defaultValues: { slug: '', authorId: '', coverImageDocumentId: null },
  });

  useEffect(() => {
    if (post) {
      reset({
        slug: post.slug,
        authorId: post.authorId,
        coverImageDocumentId: post.coverImageDocumentId ?? null,
      });
    }
  }, [post, reset]);

  function onSubmit(values: PostMetadataValues) {
    if (isEdit && post) {
      updatePost.mutate(
        {
          id: post.id,
          request: {
            slug: values.slug,
            authorId: values.authorId,
            coverImageDocumentId: values.coverImageDocumentId,
            concurrencyStamp: post.concurrencyStamp,
          },
        },
        {
          onSuccess: (updated) => {
            toast.success(t('blog:Posts.UpdateSuccess', 'Post updated.'));
            onSaved?.(updated);
          },
          onError: (error) => onConflict?.(error),
        }
      );
    } else {
      createPost.mutate(
        {
          siteId,
          request: {
            slug: values.slug,
            authorId: values.authorId,
            coverImageDocumentId: values.coverImageDocumentId,
          },
        },
        {
          onSuccess: (created) => {
            toast.success(t('blog:Posts.CreateSuccess', 'Post created.'));
            onSaved?.(created);
          },
        }
      );
    }
  }

  const isPending = createPost.isPending || updatePost.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-lg space-y-6"
      data-slot="post-metadata-form"
    >
      <div className="space-y-2">
        <Label htmlFor="slug">{t('blog:Posts.Fields.Slug', 'Slug')}</Label>
        <Input id="slug" {...register('slug')} placeholder="my-post" className="font-mono" />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="authorId">{t('blog:Posts.Fields.AuthorId', 'Author')}</Label>
        <Controller
          control={control}
          name="authorId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="authorId">
                <SelectValue
                  placeholder={t('blog:Posts.Fields.AuthorPlaceholder', 'Select an author')}
                />
              </SelectTrigger>
              <SelectContent>
                {(authors ?? []).map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.authorId && <p className="text-sm text-destructive">{errors.authorId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t('blog:Posts.Fields.CoverImage', 'Cover image')}</Label>
        <Controller
          control={control}
          name="coverImageDocumentId"
          render={({ field }) => (
            <DocumentPickerButton
              value={field.value}
              onChange={field.onChange}
              pickLabel={t('blog:Posts.Fields.PickCover', 'Select cover…')}
              clearLabel={t('blog:Common.Remove', 'Remove')}
            />
          )}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('blog:Common.Saving', 'Saving…') : t('blog:Common.Save', 'Save')}
        </Button>
        <Button type="button" variant="outline" onClick={() => onCancel?.()}>
          {t('blog:Common.Cancel', 'Cancel')}
        </Button>
      </div>
    </form>
  );
}
