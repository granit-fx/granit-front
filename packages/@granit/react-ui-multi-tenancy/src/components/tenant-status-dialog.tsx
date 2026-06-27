import { useTranslation } from '@granit/react-localization';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

interface TenantStatusDialogProps {
  readonly tenantName: string;
  readonly action: 'activate' | 'deactivate';
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isPending: boolean;
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
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone={action === 'deactivate' ? 'destructive' : 'default'}
      title={
        action === 'deactivate'
          ? t('Tenants.StatusDialog.DeactivateTitle')
          : t('Tenants.StatusDialog.ActivateTitle')
      }
      description={
        action === 'deactivate'
          ? t('Tenants.StatusDialog.DeactivateDescription', { name: tenantName })
          : t('Tenants.StatusDialog.ActivateDescription', { name: tenantName })
      }
      confirmLabel={
        action === 'deactivate' ? t('Tenants.Actions.Deactivate') : t('Tenants.Actions.Activate')
      }
      busyLabel={t('Common.Loading')}
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}
