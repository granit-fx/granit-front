import { blogConstraints } from '@granit/blog';
import { useAuthor, useCreateAuthor, useUpdateAuthor } from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import { toast, Button, Input, Label, Separator, Textarea } from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';

import { DocumentPickerButton } from './document-picker-button';

interface AuthorFormValues {
  userId: string;
  displayName: string;
  bio: string;
  avatarDocumentId: string | null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface AuthorFormPageProps {
  /** Site id for the create flow. */
  readonly siteId: string;
  /** Author id in edit mode; omit for create. */
  readonly authorId?: string;
  /** Called after a successful save. Host navigates back. */
  readonly onDone?: () => void;
  /** Called when the user cancels / goes back. */
  readonly onCancel?: () => void;
}

/** Create / edit an author profile (user, display name, bio, avatar). */
export function AuthorFormPage({ siteId, authorId, onDone, onCancel }: AuthorFormPageProps) {
  const { t } = useTranslation();
  const id = authorId;
  const isEdit = Boolean(id);

  const { data: author, isLoading } = useAuthor(id ?? '', { enabled: isEdit });
  const createAuthor = useCreateAuthor();
  const updateAuthor = useUpdateAuthor();

  const formResolver = createConstraintsResolver(
    isEdit
      ? blogConstraints.BlogAuthorProfileUpdateRequest
      : blogConstraints.BlogAuthorProfileCreateRequest,
    t,
    { labelResolver: (field) => t(`blog:Authors.Fields.${capitalize(field)}`, field) }
  ) as unknown as Resolver<AuthorFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AuthorFormValues>({
    resolver: formResolver,
    defaultValues: { userId: '', displayName: '', bio: '', avatarDocumentId: null },
  });

  useEffect(() => {
    if (author) {
      reset({
        userId: author.userId,
        displayName: author.displayName,
        bio: author.bio ?? '',
        avatarDocumentId: author.avatarDocumentId ?? null,
      });
    }
  }, [author, reset]);

  function onSubmit(values: AuthorFormValues) {
    if (isEdit && id) {
      updateAuthor.mutate(
        {
          id,
          request: {
            displayName: values.displayName,
            bio: values.bio || null,
            avatarDocumentId: values.avatarDocumentId,
          },
        },
        {
          onSuccess: () => {
            toast.success(t('blog:Authors.UpdateSuccess', 'Author updated.'));
            onDone?.();
          },
        }
      );
    } else {
      createAuthor.mutate(
        {
          siteId,
          request: {
            userId: values.userId,
            displayName: values.displayName,
            bio: values.bio || null,
            avatarDocumentId: values.avatarDocumentId,
          },
        },
        {
          onSuccess: () => {
            toast.success(t('blog:Authors.CreateSuccess', 'Author created.'));
            onDone?.();
          },
        }
      );
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">{t('blog:Common.Loading', 'Loading…')}</p>;
  }

  const isPending = createAuthor.isPending || updateAuthor.isPending;
  const title = isEdit
    ? t('blog:Authors.EditTitle', 'Edit author')
    : t('blog:Authors.CreateTitle', 'New author');

  return (
    <div data-slot="author-form-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => onCancel?.()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('blog:Authors.Title', 'Authors')}
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="userId">{t('blog:Authors.Fields.UserId', 'User')}</Label>
            <Input
              id="userId"
              {...register('userId')}
              placeholder="user id"
              className="font-mono"
            />
            {errors.userId && <p className="text-sm text-destructive">{errors.userId.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="displayName">
            {t('blog:Authors.Fields.DisplayName', 'Display name')}
          </Label>
          <Input id="displayName" {...register('displayName')} />
          {errors.displayName && (
            <p className="text-sm text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">{t('blog:Authors.Fields.Bio', 'Bio')}</Label>
          <Textarea id="bio" {...register('bio')} rows={4} />
          {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('blog:Authors.Fields.Avatar', 'Avatar')}</Label>
          <Controller
            control={control}
            name="avatarDocumentId"
            render={({ field }) => (
              <DocumentPickerButton
                value={field.value}
                onChange={field.onChange}
                pickLabel={t('blog:Authors.Fields.PickAvatar', 'Select avatar…')}
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
    </div>
  );
}
