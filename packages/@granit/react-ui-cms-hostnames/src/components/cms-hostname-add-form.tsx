import { cmsHostnamesConstraints } from '@granit/cms-hostnames';
import { useAddSiteHostname } from '@granit/react-cms-hostnames';
import { useTranslation } from '@granit/react-localization';
import { toast, Button, Checkbox, Input, Label } from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { Controller, useForm, type Resolver } from 'react-hook-form';

// Client-only UX guard for a real FQDN. The CMS contract carries only
// `required` + `maxLength` on `host` (the .NET endpoint runs the authoritative
// hostname check), so this regex is a front augmentation layered ON TOP of the
// spec-derived constraints — drop it once the backend exposes the pattern in
// contracts/openapi/cms-hostnames.json.
const FQDN_RE =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// The constraints expose lowercase field names (`host`); the i18n label keys are
// PascalCase (`cms:Hostnames.Fields.Host`). @granit/utils has no capitalize, so
// this local helper bridges the two for the labelResolver.
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface AddHostnameFormValues {
  readonly host: string;
  readonly isPrimary: boolean;
}

export interface CmsHostnameAddFormProps {
  readonly siteId: string;
}

export function CmsHostnameAddForm({ siteId }: CmsHostnameAddFormProps) {
  const { t } = useTranslation();
  const addHostname = useAddSiteHostname(siteId);

  // `host` validation = spec constraints (required, maxLength 253) plus the
  // client-only FQDN check above. `Validation:Builtin:*` messages are owned by
  // the backend `Granit.Validation` package (loaded by the host app). The form
  // field name `host` matches the SiteHostnameCreateRequest property name, so no
  // remapping is needed.
  const baseResolver = createConstraintsResolver(
    cmsHostnamesConstraints.SiteHostnameCreateRequest,
    t,
    { labelResolver: (field) => t(`cms:Hostnames.Fields.${capitalize(field)}`, field) }
  );
  const formResolver = (async (
    values: Record<string, unknown>,
    context: unknown,
    options: { fields: Record<string, { name: string }> }
  ) => {
    const result = await baseResolver(values, context, options);
    if (
      !result.errors.host &&
      typeof values.host === 'string' &&
      values.host &&
      !FQDN_RE.test(values.host)
    ) {
      result.errors.host = { type: 'fqdn', message: t('cms:Hostnames.InvalidHost') };
    }
    return result;
  }) as unknown as Resolver<AddHostnameFormValues>;

  const { register, handleSubmit, reset, control, formState } = useForm<AddHostnameFormValues>({
    resolver: formResolver,
    defaultValues: { host: '', isPrimary: false },
  });

  function onAddSubmit(values: AddHostnameFormValues) {
    // `mutate` (not `mutateAsync`) routes failures to the headless
    // MutationCache.onError toast — no local catch needed.
    addHostname.mutate(
      { host: values.host, isPrimary: values.isPrimary },
      {
        onSuccess: () => {
          toast.success(t('cms:Hostnames.AddSuccess', 'Hostname added.'));
          reset();
        },
      }
    );
  }

  return (
    <form
      data-slot="cms-hostname-add-form"
      onSubmit={handleSubmit(onAddSubmit)}
      className="flex items-end gap-3"
    >
      <div className="space-y-1">
        <Label htmlFor="host">{t('cms:Hostnames.Fields.Host', 'Hostname')}</Label>
        <Input
          id="host"
          {...register('host')}
          placeholder="example.com"
          className="w-64 font-mono"
          aria-invalid={formState.errors.host ? true : undefined}
          aria-describedby={formState.errors.host ? 'host-error' : undefined}
        />
        {formState.errors.host?.message && (
          <p id="host-error" className="text-sm text-destructive">
            {formState.errors.host.message}
          </p>
        )}
      </div>
      <Controller
        control={control}
        name="isPrimary"
        render={({ field }) => (
          <div className="flex items-center gap-2 pb-1">
            <Checkbox
              id="isPrimary"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
            />
            <Label htmlFor="isPrimary">{t('cms:Hostnames.Fields.IsPrimary', 'Primary')}</Label>
          </div>
        )}
      />
      <Button type="submit" disabled={addHostname.isPending}>
        {addHostname.isPending
          ? t('cms:Common.Saving', 'Saving…')
          : t('cms:Hostnames.Add', 'Add hostname')}
      </Button>
    </form>
  );
}
