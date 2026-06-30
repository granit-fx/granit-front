import { cmsConstraints } from '@granit/cms';
import { useCreatePage, usePage, usePageTree, useSite, useUpdatePage } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  toast,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { buildPageEditorUrl } from '../renderer';

interface PageFormValues {
  slugSegment: string;
  parentId: string;
  layoutKey: string;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Spec-driven validation from the OpenAPI contract (CreatePageRequest constrains
 * parentId / slugSegment / layoutKey). `layoutKey` is a required-key / nullable-value
 * field — empty is a legitimate "no layout", so its `required` error is dropped here
 * (mirrors the field augmentation in @granit/react-ui-hostnames' add dialog).
 * `Validation:Builtin:*` messages are owned by the host's @granit/Validation bundle.
 */
function buildFormResolver(t: ReturnType<typeof useTranslation>['t']): Resolver<PageFormValues> {
  const baseResolver = createConstraintsResolver(cmsConstraints.CreatePageRequest, t, {
    labelResolver: (field) => t(`cms:Pages.Fields.${capitalize(field)}`, field),
  });
  return (async (
    values: Record<string, unknown>,
    context: unknown,
    options: { fields: Record<string, { name: string }> }
  ) => {
    const result = await baseResolver(values, context, options);
    if (result.errors.layoutKey && (values.layoutKey ?? '') === '') {
      delete result.errors.layoutKey;
    }
    return result;
  }) as unknown as Resolver<PageFormValues>;
}

/**
 * Create / rename a CMS page *structure* node (slug + parent + layout).
 *
 * Page *content* (blocks) is authored in the granit-cms-renderer Puck editor —
 * in edit mode this page surfaces an "Edit content" link-out to it (gated by
 * `VITE_CMS_RENDERER_URL`).
 */
export function PageFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: siteId, pageId } = useParams<{ id: string; pageId?: string }>();
  const isEdit = Boolean(pageId);
  const effectiveSiteId = siteId ?? '';
  const pagesPath = `/cms/sites/${effectiveSiteId}/pages`;

  const { data: tree } = usePageTree(effectiveSiteId);
  const { data: site } = useSite(effectiveSiteId, { enabled: effectiveSiteId.length > 0 });
  const { data: page, isLoading } = usePage(pageId ?? '', { enabled: isEdit });
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();

  const formResolver = buildFormResolver(t);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<PageFormValues>({
    resolver: formResolver,
    defaultValues: { slugSegment: '', parentId: '', layoutKey: '' },
  });

  useEffect(() => {
    if (page) {
      reset({
        slugSegment: page.slugSegment,
        parentId: page.parentId ?? '',
        layoutKey: page.layoutKey ?? '',
      });
    }
  }, [page, reset]);

  // Pre-select the site root as the default parent once the tree loads (create mode only).
  const parentInitialized = useRef(false);
  useEffect(() => {
    if (isEdit || parentInitialized.current || !tree || tree.length === 0) {
      return;
    }
    const root = tree.find((node) => node.isSiteRoot) ?? tree[0];
    if (!root) return;
    setValue('parentId', root.id);
    parentInitialized.current = true;
  }, [isEdit, tree, setValue]);

  function submitEdit(slugSegment: string) {
    if (!pageId || !page) return;
    updatePage.mutate(
      { id: pageId, request: { slugSegment, concurrencyStamp: page.concurrencyStamp } },
      {
        onSuccess: () => {
          toast.success(t('cms:Pages.UpdateSuccess', 'Page updated.'));
          navigate(pagesPath);
        },
      }
    );
  }

  function submitCreate(values: PageFormValues, slugSegment: string) {
    createPage.mutate(
      {
        // Site is derived from the parent on the backend; parentId is required
        // (defaults to the site root, set on mount). layoutKey is a
        // required-key / nullable-value field.
        parentId: values.parentId,
        slugSegment,
        layoutKey: values.layoutKey.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(t('cms:Pages.CreateSuccess', 'Page created.'));
          navigate(pagesPath);
        },
      }
    );
  }

  function onSubmit(values: PageFormValues) {
    const slugSegment = values.slugSegment.trim();
    if (isEdit) {
      submitEdit(slugSegment);
    } else {
      submitCreate(values, slugSegment);
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  const isSiteRoot = isEdit && (page?.isSiteRoot ?? false);
  const isPending = createPage.isPending || updatePage.isPending;
  const title = isEdit
    ? t('cms:Pages.EditTitle', 'Edit page')
    : t('cms:Pages.CreateTitle', 'New page');
  const parentOptions = (tree ?? []).filter((node) => !isEdit || node.id !== pageId);
  const treeLoaded = tree !== undefined;
  const noRootPage = !isEdit && treeLoaded && parentOptions.length === 0;

  if (noRootPage) {
    return (
      <div data-slot="page-form-page" className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={pagesPath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('cms:Pages.Title', 'Pages')}
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'cms:Pages.NoRootPage',
            'This site has no root page yet. The root page is created automatically when the site is initialised — restart the application to trigger the seed, or contact an administrator.'
          )}
        </p>
      </div>
    );
  }
  const editorUrl =
    isEdit && pageId ? buildPageEditorUrl(pageId, site?.defaultCulture ?? 'en') : null;

  return (
    <div data-slot="page-form-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={pagesPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Pages.Title', 'Pages')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <div className="space-y-2">
          <Label htmlFor="slugSegment">{t('cms:Pages.Fields.Slug', 'Slug segment')}</Label>
          {isSiteRoot ? (
            <>
              <Input id="slugSegment" value="/" disabled className="font-mono" />
              <p className="text-xs text-muted-foreground">
                {t('cms:Pages.Fields.SlugRootHint', 'The site root path cannot be renamed.')}
              </p>
            </>
          ) : (
            <>
              <Input
                id="slugSegment"
                {...register('slugSegment', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toLowerCase();
                  },
                })}
                placeholder="about"
                className="font-mono"
                aria-describedby={errors.slugSegment ? 'slugSegment-error' : undefined}
              />
              {errors.slugSegment ? (
                <p id="slugSegment-error" className="text-sm text-destructive">
                  {errors.slugSegment.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t(
                    'cms:Pages.Fields.SlugHint',
                    'Lowercase letters, digits and hyphens only (e.g. my-page).'
                  )}
                </p>
              )}
            </>
          )}
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="parentId">{t('cms:Pages.Fields.Parent', 'Parent page')}</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-describedby={errors.parentId ? 'parentId-error' : undefined}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue
                      placeholder={t('cms:Pages.Fields.ParentPlaceholder', 'Select a parent')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((node) => (
                      <SelectItem key={node.id} value={node.id} className="font-mono">
                        {node.isSiteRoot
                          ? t('cms:Pages.RootLabel', '/ (site root)')
                          : node.structurePath}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.parentId && (
              <p id="parentId-error" className="text-sm text-destructive">
                {errors.parentId.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('cms:Pages.Fields.ParentHint', 'The new page is nested under this page.')}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="layoutKey">{t('cms:Pages.Fields.Layout', 'Layout key')}</Label>
          <Input
            id="layoutKey"
            {...register('layoutKey')}
            placeholder={t('cms:Common.Optional', 'Optional')}
            className="font-mono"
            disabled={isEdit}
            aria-describedby={errors.layoutKey ? 'layoutKey-error' : undefined}
          />
          {errors.layoutKey && (
            <p id="layoutKey-error" className="text-sm text-destructive">
              {errors.layoutKey.message}
            </p>
          )}
        </div>

        {isEdit && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              {t('cms:Pages.Content.Title', 'Page content')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                'cms:Pages.Content.Description',
                'Block content is authored in the visual editor (granit-cms-renderer).'
              )}
            </p>
            {editorUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={editorUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('cms:Pages.Content.EditContent', 'Edit content')}
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                title={t(
                  'cms:Pages.Content.NoRenderer',
                  'Set VITE_CMS_RENDERER_URL to enable content editing.'
                )}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('cms:Pages.Content.EditContent', 'Edit content')}
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || isSiteRoot}>
            {isPending ? t('cms:Common.Saving', 'Saving…') : t('cms:Common.Save', 'Save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(pagesPath)}>
            {t('cms:Common.Cancel', 'Cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
