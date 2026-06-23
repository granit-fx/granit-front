import { useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogAction,
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
import { WebhookSubscriptionStatus } from '@granit/webhooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { webhookDeactivationSchema, type WebhookDeactivationFormValues } from '../validation';

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

  const deactivationForm = useForm<WebhookDeactivationFormValues>({
    resolver: zodResolver(webhookDeactivationSchema),
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
      <AlertDialog
        open={openDialog === 'activate'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Webhooks.Confirm.ActivateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Webhooks.Confirm.ActivateMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirm('activate')}>
              {t('Webhooks.Actions.Activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend dialog */}
      <AlertDialog
        open={openDialog === 'suspend'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Webhooks.Confirm.SuspendTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Webhooks.Confirm.SuspendMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirm('suspend')}>
              {t('Webhooks.Actions.Suspend')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      <AlertDialog
        open={openDialog === 'delete'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Webhooks.Confirm.DeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Webhooks.Confirm.DeleteMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirm('delete')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Webhooks.Actions.Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
