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
} from '@granit/react-ui';

interface TenantStatusDialogProps {
  readonly tenantName: string;
  readonly action: 'activate' | 'deactivate';
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isPending: boolean;
}

function pickTenantStatusActionLabel(
  isPending: boolean,
  action: 'activate' | 'deactivate',
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (isPending) return t('Common.Loading');
  return action === 'deactivate' ? t('Tenants.Actions.Deactivate') : t('Tenants.Actions.Activate');
}

export function TenantStatusDialog({
  tenantName,
  action,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: TenantStatusDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === 'deactivate'
              ? t('Tenants.StatusDialog.DeactivateTitle')
              : t('Tenants.StatusDialog.ActivateTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === 'deactivate'
              ? t('Tenants.StatusDialog.DeactivateDescription', { name: tenantName })
              : t('Tenants.StatusDialog.ActivateDescription', { name: tenantName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={
              action === 'deactivate'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {pickTenantStatusActionLabel(isPending, action, t)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
