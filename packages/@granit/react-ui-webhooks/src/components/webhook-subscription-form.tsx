import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { useEventTypes } from '@granit/react-webhooks';
import { webhooksConstraints } from '@granit/webhooks';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { useBeforeUnload } from 'react-router-dom';

import { validateTargetUrl, type WebhookSubscriptionFormValues } from '../validation';

interface WebhookSubscriptionFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<WebhookSubscriptionFormValues>;
  onSubmit: (data: WebhookSubscriptionFormValues) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
}

export function WebhookSubscriptionForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isPending = false,
}: Readonly<WebhookSubscriptionFormProps>) {
  const { t } = useTranslation();
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes();

  const groupedEventTypes = (eventTypes ?? []).reduce<Record<string, typeof eventTypes>>(
    (acc, et) => {
      const key = et.category ?? '';
      acc[key] ??= [];
      acc[key].push(et);
      return acc;
    },
    {}
  );

  // Spec-derived validation. Create validates `targetUrl` + `eventType`; the
  // Update DTO only carries `targetUrl` (the event type is immutable after
  // creation), so in edit mode the resolver leaves `eventType` to the client-only
  // "select one" guard below. Field names already match the request DTO property
  // names, so no label remapping beyond the i18n keys is needed.
  const formResolver = useMemo<Resolver<WebhookSubscriptionFormValues>>(() => {
    const baseResolver = createConstraintsResolver(
      mode === 'create'
        ? webhooksConstraints.WebhookSubscriptionCreateRequest
        : webhooksConstraints.WebhookSubscriptionUpdateRequest,
      t,
      {
        labelResolver: (field) =>
          field === 'eventType' ? t('Webhooks.Form.EventType') : t('Webhooks.Form.TargetUrl'),
      }
    );

    return (async (
      values: Record<string, unknown>,
      context: unknown,
      options: { fields: Record<string, { name: string }> }
    ) => {
      const result = await baseResolver(values, context, options);

      // Client-only SSRF guards on `targetUrl` (URL format, HTTPS, private/local
      // host) — not expressed by the scalar spec constraints. Layered ON TOP, and
      // only when the spec resolver did not already flag the field.
      if (!result.errors.targetUrl && typeof values.targetUrl === 'string') {
        const urlError = validateTargetUrl(values.targetUrl, t);
        if (urlError) {
          result.errors.targetUrl = { type: 'targetUrl', message: urlError };
        }
      }

      // Client-only "an event type must be selected" guard. The Update DTO does
      // not constrain `eventType`, so this preserves the original always-required
      // behavior in both modes for the multiselect-style Select field.
      if (!result.errors.eventType && !values.eventType) {
        // 'Validation:Builtin:NotEmpty' is the shared required-field key owned by
        // the backend Granit.Validation package (same key the spec resolver emits
        // for a missing field), so the message matches across both modes.
        result.errors.eventType = {
          type: 'required',
          message: t('Validation:Builtin:NotEmpty', {
            PropertyName: t('Webhooks.Form.EventType'),
            nsSeparator: false,
          } as Record<string, unknown>),
        };
      }

      return result;
    }) as unknown as Resolver<WebhookSubscriptionFormValues>;
  }, [mode, t]);

  const form = useForm<WebhookSubscriptionFormValues>({
    resolver: formResolver,
    defaultValues: {
      targetUrl: '',
      eventType: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({ targetUrl: '', eventType: '', ...defaultValues });
    }
  }, [defaultValues, form]);

  const isDirty = form.formState.isDirty;
  useBeforeUnload(
    (event) => {
      if (isDirty) {
        event.preventDefault();
      }
    },
    { capture: true }
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const currentTargetUrl = useWatch({ control: form.control, name: 'targetUrl' });
  const isUrlChanged = mode === 'edit' && currentTargetUrl !== (defaultValues?.targetUrl ?? '');

  return (
    <Form {...form}>
      <form data-slot="webhook-subscription-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'create' ? t('Webhooks.Create') : t('Webhooks.Form.TargetUrl')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Webhooks.Form.TargetUrl')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('Webhooks.Form.TargetUrlPlaceholder')}
                      type="url"
                    />
                  </FormControl>
                  <FormDescription>{t('Webhooks.Form.TargetUrlHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isUrlChanged && (
              <Alert variant="default">
                <AlertTriangle className="size-4" />
                <AlertDescription>{t('Webhooks.Form.UrlChangeWarning')}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Webhooks.Form.EventType')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Webhooks.Form.EventTypePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypesLoading && (
                        <div className="p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      )}
                      {Object.entries(groupedEventTypes).map(([category, types]) =>
                        category ? (
                          <SelectGroup key={category}>
                            <SelectLabel>{category}</SelectLabel>
                            {types!.map((et) => (
                              <SelectItem key={et.eventType} value={et.eventType}>
                                {et.displayName ?? et.eventType}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ) : (
                          types!.map((et) => (
                            <SelectItem key={et.eventType} value={et.eventType}>
                              {et.displayName ?? et.eventType}
                            </SelectItem>
                          ))
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('Common.Cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {t('Common.Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
