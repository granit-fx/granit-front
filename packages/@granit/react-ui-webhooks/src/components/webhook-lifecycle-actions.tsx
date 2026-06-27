import { useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { WebhookSubscriptionStatus, webhooksConstraints } from '@granit/webhooks';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import type { WebhookDeactivationFormValues } from '../validation';

type DialogType = 'activate' | 'suspend' | 'deactivate' | 'delete' | null;

interface WebhookLifecycleActionsProps {
  status: WebhookSubscriptionStatus;
  onActivate: () => void;
  onSuspend: () => void;
  onDeactivate: (reason: string) => void;
  onDelete: () => void;
  isActivating?: boolean;
  isSuspending?: boolean;
  isDeactivating?: boolean;
  isDeleting?: boolean;
}

export function WebhookLifecycleActions({
  status,
  onActivate,
  onSuspend,
  onDeactivate,
  onDelete,
  isActivating = false,
  isSuspending = false,
  isDeactivating = false,
  isDeleting = false,
}: Readonly<WebhookLifecycleActionsProps>) {
  const { t } = useTranslation();
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  // Spec-derived validation for the deactivation reason (required, maxLength 1000
  // from WebhookSubscriptionDeactivateRequest). No client-only rule — the former
  // zod schema only required a non-empty reason, which the spec already covers.
  const formResolver = useMemo<Resolver<WebhookDeactivationFormValues>>(
    () =>
      createConstraintsResolver(webhooksConstraints.WebhookSubscriptionDeactivateRequest, t, {
        labelResolver: () => t('Webhooks.Confirm.DeactivateReason'),
      }) as unknown as Resolver<WebhookDeactivationFormValues>,
    [t]
  );

  const deactivationForm = useForm<WebhookDeactivationFormValues>({
    resolver: formResolver,
    defaultValues: { reason: '' },
  });

  const handleDeactivateConfirm = deactivationForm.handleSubmit((data) => {
    onDeactivate(data.reason);
    setOpenDialog(null);
    deactivationForm.reset();
  });

  const handleConfirm = (type: Exclude<DialogType, 'deactivate' | null>) => {
    if (type === 'activate') onActivate();
    else if (type === 'suspend') onSuspend();
    else if (type === 'delete') onDelete();
    setOpenDialog(null);
  };

  return (
    <div data-slot="webhook-lifecycle-actions" className="flex flex-wrap gap-2">
      {status !== WebhookSubscriptionStatus.Active &&
        status !== WebhookSubscriptionStatus.Deactivated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenDialog('activate')}
            disabled={isActivating}
          >
            {isActivating && <Loader2 className="mr-1 size-3.5 animate-spin" />}
            {t('Webhooks.Actions.Activate')}
          </Button>
        )}

      {status === WebhookSubscriptionStatus.Active && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDialog('suspend')}
          disabled={isSuspending}
        >
          {isSuspending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
          {t('Webhooks.Actions.Suspend')}
        </Button>
      )}

      {status !== WebhookSubscriptionStatus.Deactivated && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDialog('deactivate')}
          disabled={isDeactivating}
        >
          {isDeactivating && <Loader2 className="mr-1 size-3.5 animate-spin" />}
          {t('Webhooks.Actions.Deactivate')}
        </Button>
      )}

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpenDialog('delete')}
        disabled={isDeleting}
      >
        {isDeleting && <Loader2 className="mr-1 size-3.5 animate-spin" />}
        {t('Webhooks.Actions.Delete')}
      </Button>

      {/* Activate dialog */}
      <ConfirmActionDialog
        open={openDialog === 'activate'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        title={t('Webhooks.Confirm.ActivateTitle')}
        description={t('Webhooks.Confirm.ActivateMessage')}
        confirmLabel={t('Webhooks.Actions.Activate')}
        onConfirm={() => handleConfirm('activate')}
      />

      {/* Suspend dialog */}
      <ConfirmActionDialog
        open={openDialog === 'suspend'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        title={t('Webhooks.Confirm.SuspendTitle')}
        description={t('Webhooks.Confirm.SuspendMessage')}
        confirmLabel={t('Webhooks.Actions.Suspend')}
        onConfirm={() => handleConfirm('suspend')}
      />

      {/* Deactivate dialog with reason */}
      <AlertDialog
        open={openDialog === 'deactivate'}
        onOpenChange={(open) => {
          if (!open) {
            setOpenDialog(null);
            deactivationForm.reset();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Webhooks.Confirm.DeactivateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Webhooks.Confirm.DeactivateMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...deactivationForm}>
            <form onSubmit={handleDeactivateConfirm} className="space-y-4">
              <FormField
                control={deactivationForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Webhooks.Confirm.DeactivateReason')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('Webhooks.Confirm.DeactivateReasonPlaceholder')}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter>
                <AlertDialogCancel type="button">{t('Common.Cancel')}</AlertDialogCancel>
                <Button type="submit" variant="destructive">
                  {t('Webhooks.Actions.Deactivate')}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <ConfirmActionDialog
        open={openDialog === 'delete'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
        tone="destructive"
        title={t('Webhooks.Confirm.DeleteTitle')}
        description={t('Webhooks.Confirm.DeleteMessage')}
        confirmLabel={t('Webhooks.Actions.Delete')}
        onConfirm={() => handleConfirm('delete')}
      />
    </div>
  );
}
