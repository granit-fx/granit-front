import { cmsRedirectsConstraints } from '@granit/cms-redirects';
import { useCreateRedirect, useUpdateRedirect } from '@granit/react-cms-redirects';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import type {
  RedirectMatchType,
  RedirectResponse,
  RedirectType,
} from '@granit/react-cms-redirects';

const REDIRECT_TYPES: readonly RedirectType[] = [
  'MovedPermanently',
  'Found',
  'TemporaryRedirect',
  'PermanentRedirect',
];

const MATCH_TYPES: readonly RedirectMatchType[] = ['Exact', 'Prefix'];

const DEFAULT_TYPE: RedirectType = 'MovedPermanently';
const DEFAULT_MATCH_TYPE: RedirectMatchType = 'Exact';

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

interface RedirectFormValues {
  source: string;
  target: string;
  culture: string;
  type: RedirectType;
  matchType: RedirectMatchType;
}

interface RedirectFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly siteId: string;
  readonly redirect: RedirectResponse | null;
}

export function RedirectFormDialog({
  open,
  onOpenChange,
  siteId,
  redirect,
}: RedirectFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(redirect);
  const createRedirect = useCreateRedirect();
  const updateRedirect = useUpdateRedirect();

  // Validation is spec-driven: constraints are generated from
  // contracts/openapi/cms-redirects.json (`source`/`target` required + pattern +
  // maxLength, `culture` maxLength). The resolver only validates registered
  // fields, so the unconstrained `type`/`matchType` selects pass through. On edit
  // `source`/`culture` are immutable (disabled), so the RedirectUpdateRequest spec
  // applies. `Validation:Builtin:*` messages are owned by the host `Granit.Validation`.
  const formResolver = useMemo(
    () =>
      createConstraintsResolver(
        isEdit
          ? cmsRedirectsConstraints.RedirectUpdateRequest
          : cmsRedirectsConstraints.RedirectCreateRequest,
        t,
        { labelResolver: (field) => t(`cms:Redirects.Fields.${capitalize(field)}`, field) }
      ) as unknown as Resolver<RedirectFormValues>,
    [isEdit, t]
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RedirectFormValues>({
    resolver: formResolver,
    defaultValues: {
      source: '',
      target: '',
      culture: '',
      type: DEFAULT_TYPE,
      matchType: DEFAULT_MATCH_TYPE,
    },
  });

  useEffect(() => {
    if (redirect) {
      reset({
        source: redirect.source,
        target: redirect.target,
        culture: redirect.culture ?? '',
        type: redirect.type,
        matchType: redirect.matchType,
      });
    } else {
      reset({
        source: '',
        target: '',
        culture: '',
        type: DEFAULT_TYPE,
        matchType: DEFAULT_MATCH_TYPE,
      });
    }
  }, [redirect, reset]);

  function onSubmit(values: RedirectFormValues) {
    const culture = values.culture.trim() || undefined;

    if (isEdit && redirect) {
      // `mutate` (not `mutateAsync`) routes failures to the global
      // MutationCache.onError toast — no local catch needed.
      updateRedirect.mutate(
        {
          id: redirect.id,
          request: {
            target: values.target,
            type: values.type,
            matchType: values.matchType,
            isActive: redirect.isActive,
          },
        },
        {
          onSuccess: (result) => {
            toast.success(t('cms:Redirects.UpdateSuccess', 'Redirect updated.'));
            if (result.conflictWarning) {
              toast.warning(result.conflictWarning);
            }
            onOpenChange(false);
          },
        }
      );
    } else {
      createRedirect.mutate(
        {
          siteId,
          request: {
            source: values.source,
            target: values.target,
            type: values.type,
            matchType: values.matchType,
            culture,
          },
        },
        {
          onSuccess: (result) => {
            toast.success(t('cms:Redirects.CreateSuccess', 'Redirect created.'));
            if (result.conflictWarning) {
              toast.warning(result.conflictWarning);
            }
            onOpenChange(false);
          },
        }
      );
    }
  }

  const isPending = createRedirect.isPending || updateRedirect.isPending;
  const title = isEdit
    ? t('cms:Redirects.EditTitle', 'Edit redirect')
    : t('cms:Redirects.CreateTitle', 'New redirect');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="redirect-form-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('cms:Redirects.FormDescription', 'Map a source path to a destination path.')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">{t('cms:Redirects.Fields.Source', 'Source path')}</Label>
            <Input
              id="source"
              {...register('source')}
              placeholder="/old-path"
              className="font-mono"
              disabled={isEdit}
              aria-describedby={errors.source ? 'source-error' : undefined}
            />
            {errors.source && (
              <p id="source-error" className="text-sm text-destructive">
                {errors.source.message}
              </p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                {t(
                  'cms:Redirects.Fields.SourceImmutable',
                  'The source path is immutable. Delete and recreate to change it.'
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">{t('cms:Redirects.Fields.Target', 'Target path')}</Label>
            <Input
              id="target"
              {...register('target')}
              placeholder="/new-path"
              className="font-mono"
              aria-describedby={errors.target ? 'target-error' : undefined}
            />
            {errors.target && (
              <p id="target-error" className="text-sm text-destructive">
                {errors.target.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="matchType">{t('cms:Redirects.Fields.MatchType', 'Match type')}</Label>
            <Controller
              control={control}
              name="matchType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="matchType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`cms:Redirects.MatchType.${value}`, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{t('cms:Redirects.Fields.Type', 'Redirect type')}</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REDIRECT_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`cms:Redirects.Type.${value}`, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="culture">{t('cms:Redirects.Fields.Culture', 'Culture')}</Label>
            <Input
              id="culture"
              {...register('culture')}
              placeholder={t('cms:Common.Optional', 'Optional')}
              className="font-mono"
              disabled={isEdit}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cms:Common.Cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('cms:Common.Saving', 'Saving…') : t('cms:Common.Save', 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
