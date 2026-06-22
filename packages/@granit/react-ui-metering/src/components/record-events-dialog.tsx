import { meteringConstraints } from '@granit/metering';
import { useTranslation } from '@granit/react-localization';
import { useRecordUsageEvents } from '@granit/react-metering';
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
  FormField,
  FormItem,
  FormMessage,
  Input,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { toEntityId, toISODateString } from '@granit/types';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { Resolver } from 'react-hook-form';

interface EventRow {
  idempotencyKey: string;
  quantity: number;
  timestamp: string;
  metadata: string;
}

interface RecordEventsFormValues {
  events: EventRow[];
}

interface RecordEventsDialogProps {
  meter: MeterDefinitionResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordEventsDialog({
  meter,
  open,
  onOpenChange,
}: Readonly<RecordEventsDialogProps>) {
  const { t } = useTranslation();
  const recordEvents = useRecordUsageEvents();

  // Validation is spec-driven: the RecordUsageRequest spec requires a non-empty
  // `events` batch (and caps its size). Per-row quantity/timestamp constraints are
  // not part of the request spec, so they stay as field-level rules below.
  const formResolver = useMemo(
    () =>
      createConstraintsResolver(meteringConstraints.RecordUsageRequest, t, {
        labelResolver: (field) => t(`Metering.Fields.${field}`, field),
      }) as unknown as Resolver<RecordEventsFormValues>,
    [t]
  );

  const form = useForm<RecordEventsFormValues>({
    resolver: formResolver,
    defaultValues: {
      events: [
        {
          idempotencyKey: crypto.randomUUID(),
          quantity: 1,
          timestamp: new Date().toISOString().slice(0, 16),
          metadata: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  const handleSubmit = form.handleSubmit((data) => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    recordEvents.mutate(
      {
        events: data.events.map((e) => ({
          meterDefinitionId: toEntityId<'MeterDefinition'>(meter.id),
          idempotencyKey: e.idempotencyKey,
          quantity: e.quantity,
          timestamp: toISODateString(new Date(e.timestamp).toISOString()),
          metadata: e.metadata || null,
        })),
      },
      {
        onSuccess: () => {
          toast.success(t('Metering.RecordEvents.Success'));
          form.reset();
          onOpenChange(false);
        },
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="record-events-dialog" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Metering.RecordEvents.Title')}</DialogTitle>
          <DialogDescription>{t('Metering.RecordEvents.Description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {t('Metering.RecordEvents.MeterDefinitionId')}:
              </span>{' '}
              <span className="font-medium text-foreground">{meter.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">({meter.unit})</span>
            </div>

            <div className="space-y-3">
              {/* Column headers */}
              {fields.length > 0 && (
                <div className="grid grid-cols-[100px_1fr_40px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>{t('Metering.RecordEvents.Quantity')}</span>
                  <span>{t('Metering.RecordEvents.Timestamp')}</span>
                  <span />
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[100px_1fr_40px] gap-2">
                  <FormField
                    control={form.control}
                    name={`events.${index}.quantity`}
                    rules={{ required: true, min: 1 }}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...f}
                            type="number"
                            min={1}
                            onChange={(e) => f.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`events.${index}.timestamp`}
                    rules={{ required: true }}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...f} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-alert-600"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={t('Metering.RecordEvents.RemoveRow')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  idempotencyKey: crypto.randomUUID(),
                  quantity: 1,
                  timestamp: new Date().toISOString().slice(0, 16),
                  metadata: '',
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('Metering.RecordEvents.AddRow')}
            </Button>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={recordEvents.isPending}
              >
                {t('Common.Cancel')}
              </Button>
              <Button type="submit" disabled={recordEvents.isPending}>
                {recordEvents.isPending ? '...' : t('Metering.RecordEvents.Submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
