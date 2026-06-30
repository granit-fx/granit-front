import { cmsConstraints, type MenuItemRequest } from '@granit/cms';
import { useMenu, useCreateMenu, useUpdateMenu } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import { toast, Button, Input, Label, Separator, Textarea } from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface MenuFormValues {
  key: string;
  title: string;
  itemsJson: string;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function MenuFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: siteId, menuId } = useParams<{ id: string; menuId?: string }>();
  const isEdit = Boolean(menuId);

  const { data: menu, isLoading } = useMenu(menuId ?? '', { enabled: isEdit });
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();

  // Spec-driven validation: `key` + `title` constraints come from the OpenAPI
  // contract (cmsConstraints.Menu{Create,Update}Request). `itemsJson` is a free
  // JSON textarea with no wire constraint, so it is validated by the parse below;
  // `siteId`/`items` are not registered form fields, so the resolver skips them.
  const formResolver = createConstraintsResolver(
    isEdit ? cmsConstraints.MenuUpdateRequest : cmsConstraints.MenuCreateRequest,
    t,
    { labelResolver: (field) => t(`cms:Menus.Fields.${capitalize(field)}`, field) }
  ) as unknown as Resolver<MenuFormValues>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MenuFormValues>({
    resolver: formResolver,
    defaultValues: {
      key: '',
      title: '',
      itemsJson: '[]',
    },
  });

  useEffect(() => {
    if (menu) {
      setValue('key', menu.key);
      setValue('title', menu.title);
      setValue('itemsJson', JSON.stringify(menu.items, null, 2));
    }
  }, [menu, setValue]);

  function onSubmit(values: MenuFormValues) {
    let items: MenuItemRequest[];
    try {
      items = JSON.parse(values.itemsJson) as MenuItemRequest[];
    } catch {
      toast.error(t('cms:Menus.JsonError', 'Invalid JSON for items.'));
      return;
    }

    if (isEdit && menuId) {
      updateMenu.mutate(
        {
          id: menuId,
          request: {
            title: values.title,
            items,
          },
        },
        {
          onSuccess: () => {
            toast.success(t('cms:Menus.UpdateSuccess', 'Menu updated.'));
            navigate(`/cms/sites/${siteId}/menus`);
          },
        }
      );
    } else {
      createMenu.mutate(
        {
          siteId: siteId ?? '',
          key: values.key,
          title: values.title,
          items,
        },
        {
          onSuccess: () => {
            toast.success(t('cms:Menus.CreateSuccess', 'Menu created.'));
            navigate(`/cms/sites/${siteId}/menus`);
          },
        }
      );
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  const isPending = createMenu.isPending || updateMenu.isPending;
  const pageTitle = isEdit
    ? t('cms:Menus.EditTitle', 'Edit menu')
    : t('cms:Menus.CreateTitle', 'New menu');

  return (
    <div data-slot="menu-form-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/cms/sites/${siteId}/menus`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Menus.Title', 'Menus')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{pageTitle}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <div className="space-y-2">
          <Label htmlFor="key">{t('cms:Menus.Fields.Key', 'Key')}</Label>
          <Input
            id="key"
            {...register('key')}
            disabled={isEdit}
            placeholder="main-nav"
            className="font-mono"
            aria-invalid={errors.key ? true : undefined}
            aria-describedby={errors.key ? 'key-error' : undefined}
          />
          {errors.key && (
            <p id="key-error" className="text-sm text-destructive">
              {errors.key.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t('cms:Menus.Fields.Title', 'Title')}</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Main navigation"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemsJson">{t('cms:Menus.Fields.Items', 'Items (JSON)')}</Label>
          <Textarea
            id="itemsJson"
            {...register('itemsJson')}
            rows={10}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? t('cms:Common.Saving', 'Saving…') : t('cms:Common.Save', 'Save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/cms/sites/${siteId}/menus`)}
          >
            {t('cms:Common.Cancel', 'Cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
