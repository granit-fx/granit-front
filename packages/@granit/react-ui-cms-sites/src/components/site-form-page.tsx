import { cmsConstraints } from '@granit/cms';
import { useSite, useCreateSite, useUpdateSite } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import { toast, Badge, Button, Input, Label, Separator, Switch } from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface SiteFormValues {
  slug: string;
  defaultCulture: string;
  allowedCultures: string;
  defaultTheme: string;
  activated: boolean;
}

/** Title-cases a form field name to match the `cms:Sites.Fields.*` key suffix. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SiteFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { data: site, isLoading } = useSite(id ?? '', { enabled: isEdit });
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();

  // Spec-derived validation: the resolver only checks fields registered on the
  // form (slug/defaultCulture/allowedCultures/defaultTheme/activated), so the
  // request-only `domains` constraint is never evaluated here. Labels map to the
  // `cms:Sites.Fields.*` keys via the field-name capitalisation.
  const formResolver = createConstraintsResolver(
    isEdit ? cmsConstraints.UpdateSiteRequest : cmsConstraints.CreateSiteRequest,
    t,
    { labelResolver: (field) => t(`cms:Sites.Fields.${capitalize(field)}`, field) }
  ) as unknown as Resolver<SiteFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: formResolver,
    defaultValues: {
      slug: '',
      defaultCulture: 'en',
      allowedCultures: 'en',
      defaultTheme: '',
      activated: true,
    },
  });

  useEffect(() => {
    if (site) {
      reset({
        slug: site.slug,
        defaultCulture: site.defaultCulture,
        allowedCultures: site.allowedCultures.join(', '),
        defaultTheme: site.defaultTheme ?? '',
        activated: site.activated,
      });
    }
  }, [site, reset]);

  function onSubmit(values: SiteFormValues) {
    const allowedCultures = values.allowedCultures
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (isEdit && id) {
      updateSite.mutate(
        {
          id,
          request: {
            defaultCulture: values.defaultCulture,
            allowedCultures,
            domains: [],
            defaultTheme: values.defaultTheme,
            activated: values.activated,
          },
        },
        {
          onSuccess: () => {
            toast.success(t('cms:Sites.UpdateSuccess', 'Site updated.'));
            navigate('/cms/sites');
          },
        }
      );
    } else {
      createSite.mutate(
        {
          slug: values.slug,
          defaultCulture: values.defaultCulture,
          allowedCultures,
          defaultTheme: values.defaultTheme || undefined,
        },
        {
          onSuccess: () => {
            toast.success(t('cms:Sites.CreateSuccess', 'Site created.'));
            navigate('/cms/sites');
          },
        }
      );
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('cms:Common.Loading', 'Loading…')}</p>;
  }

  const isPending = createSite.isPending || updateSite.isPending;
  const title = isEdit
    ? t('cms:Sites.EditTitle', 'Edit site')
    : t('cms:Sites.CreateTitle', 'New site');

  return (
    <div data-slot="site-form-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cms/sites">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cms:Sites.Title', 'Sites')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <div className="space-y-2">
          <Label htmlFor="slug">{t('cms:Sites.Fields.Slug', 'Slug')}</Label>
          <Input
            id="slug"
            {...register('slug')}
            disabled={isEdit}
            placeholder="my-site"
            className="font-mono"
          />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultCulture">
            {t('cms:Sites.Fields.DefaultCulture', 'Default culture')}
          </Label>
          <Input
            id="defaultCulture"
            {...register('defaultCulture')}
            placeholder="en"
            className="font-mono"
          />
          {errors.defaultCulture && (
            <p className="text-sm text-destructive">{errors.defaultCulture.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="allowedCultures">
            {t('cms:Sites.Fields.AllowedCultures', 'Allowed cultures')}
          </Label>
          <Input id="allowedCultures" {...register('allowedCultures')} placeholder="en, fr, de" />
          {errors.allowedCultures && (
            <p className="text-sm text-destructive">{errors.allowedCultures.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('cms:Sites.Fields.AllowedCulturesHint', 'Comma-separated list of culture codes.')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultTheme">
            {t('cms:Sites.Fields.DefaultTheme', 'Default theme')}
          </Label>
          <Input id="defaultTheme" {...register('defaultTheme')} placeholder="default" />
          {errors.defaultTheme && (
            <p className="text-sm text-destructive">{errors.defaultTheme.message}</p>
          )}
        </div>

        {isEdit && (
          <Controller
            control={control}
            name="activated"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch id="activated" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="activated">{t('cms:Sites.Fields.Activated', 'Activated')}</Label>
                <Badge variant={field.value ? 'default' : 'secondary'}>
                  {field.value
                    ? t('cms:Sites.Status.Active', 'Active')
                    : t('cms:Sites.Status.Inactive', 'Inactive')}
                </Badge>
              </div>
            )}
          />
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? t('cms:Common.Saving', 'Saving…') : t('cms:Common.Save', 'Save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/cms/sites')}>
            {t('cms:Common.Cancel', 'Cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
