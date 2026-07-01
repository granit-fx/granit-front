import { useTranslation } from '@granit/react-localization';
import { useAssignSeat } from '@granit/react-subscriptions';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { subscriptionsConstraints } from '@granit/subscriptions';
import { toEntityId } from '@granit/types';
import { useForm, type Resolver } from 'react-hook-form';

import type { SubscriptionId } from '@granit/subscriptions';
import type { UserId } from '@granit/types';

interface AssignSeatFormValues {
  userId: string;
}

interface AssignSeatDialogProps {
  readonly subscriptionId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AssignSeatDialog({ subscriptionId, open, onOpenChange }: AssignSeatDialogProps) {
  const { t } = useTranslation();
  const assignSeat = useAssignSeat(toEntityId<'Subscription'>(subscriptionId) as SubscriptionId);

  const form = useForm<AssignSeatFormValues>({
    resolver: createConstraintsResolver(subscriptionsConstraints.SeatAssignRequest, t, {
      labelResolver: (field) => t(`Subscriptions.Seats.Form.${field}`, field),
    }) as unknown as Resolver<AssignSeatFormValues>,
    defaultValues: { userId: '' },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  function onSubmit(values: AssignSeatFormValues) {
    assignSeat.mutate(
      { userId: toEntityId<'User'>(values.userId) as UserId },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Seats.AssignSuccess'));
          handleOpenChange(false);
        },
      }
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={t('Subscriptions.Seats.Assign')}
      description={t('Subscriptions.Seats.AssignDescription')}
      submitLabel={t('Subscriptions.Seats.Assign')}
      busyLabel={t('Common.Loading')}
      isSubmitting={assignSeat.isPending}
      data-slot="assign-seat-dialog"
    >
      <FormField
        control={form.control}
        name="userId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Subscriptions.Seats.Form.UserId')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
