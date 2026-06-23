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
import { useEventTypes } from '@granit/react-webhooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useBeforeUnload } from 'react-router-dom';

import { webhookSubscriptionFormSchema, type WebhookSubscriptionFormValues } from '../validation';

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

  const form = useForm<WebhookSubscriptionFormValues>({
    resolver: zodResolver(webhookSubscriptionFormSchema),
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
