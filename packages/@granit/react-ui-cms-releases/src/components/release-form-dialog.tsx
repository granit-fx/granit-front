import { cmsConstraints } from '@granit/cms';
import { useCreateRelease, useScheduleRelease } from '@granit/react-cms';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@granit/react-ui';
import { TimezonePicker } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface ReleaseFormValues {
  name: string;
  localDateTime: string;
  timeZoneId: string | null;
}

interface ReleaseFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly siteId: string;
}

/**
 * Create dialog for CMS releases. Validation is spec-driven via
 * {@link createConstraintsResolver} against `CreateReleaseRequest` (only the
 * registered `name` field is checked here — `siteId` is supplied by the caller).
 * Scheduling is optional: when a date/time is provided the release is created and
 * then scheduled (two API calls, matching the backend's create-then-schedule model).
 * The timezone defaults to the user's preferred zone via {@link TimezonePicker}.
 */
export function ReleaseFormDialog({ open, onOpenChange, siteId }: ReleaseFormDialogProps) {
  const { t } = useTranslation();
  const createRelease = useCreateRelease();
  const scheduleRelease = useScheduleRelease();

  const formResolver = createConstraintsResolver(cmsConstraints.CreateReleaseRequest, t, {
    labelResolver: (field) => t(`cms:Releases.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ReleaseFormValues>;

  const form = useForm<ReleaseFormValues>({
    resolver: formResolver,
    defaultValues: { name: '', localDateTime: '', timeZoneId: null },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: '', localDateTime: '', timeZoneId: null });
    }
  }, [open, form]);

  function finish() {
    toast.success(t('cms:Releases.CreateSuccess', 'Release created.'));
    onOpenChange(false);
  }

  function onSubmit(values: ReleaseFormValues) {
    const localDateTime = values.localDateTime.trim();
    const timeZoneId = values.timeZoneId;

    // `mutate` (not `mutateAsync`) routes failures to the global mutation-cache
    // error toast — no local catch needed.
    createRelease.mutate(
      { siteId, name: values.name.trim() },
      {
        onSuccess: (created) => {
          if (localDateTime && timeZoneId) {
            scheduleRelease.mutate(
              {
                id: created.id,
                request: { localDateTime, timeZoneId, concurrencyStamp: created.concurrencyStamp },
              },
              { onSuccess: finish }
            );
          } else {
            finish();
          }
        },
      }
    );
  }

  const isPending = createRelease.isPending || scheduleRelease.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="release-form-dialog">
        <DialogHeader>
          <DialogTitle>{t('cms:Releases.CreateTitle', 'New release')}</DialogTitle>
          <DialogDescription>
            {t(
              'cms:Releases.CreateDescription',
              'Name the release and optionally schedule when it should publish.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cms:Releases.Fields.Name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('cms:Releases.Fields.NamePlaceholder', 'e.g. Spring relaunch')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="localDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cms:Releases.Fields.ScheduleAt', 'Schedule at')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'cms:Releases.Fields.ScheduleHint',
                      'Optional — leave empty to keep as draft.'
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeZoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cms:Releases.Fields.Timezone', 'Timezone')}</FormLabel>
                  <FormControl>
                    <TimezonePicker
                      value={field.value}
                      onChange={field.onChange}
                      clearable={false}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cms:Common.Cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('cms:Common.Saving', 'Saving…') : t('cms:Common.Save', 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
