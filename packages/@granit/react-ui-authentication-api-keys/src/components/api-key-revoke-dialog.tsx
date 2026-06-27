import { useTranslation } from '@granit/react-localization';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

interface ApiKeyRevokeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  keyName: string;
  isPending?: boolean;
}

export function ApiKeyRevokeDialog({
  open,
  onOpenChange,
  onConfirm,
  keyName,
  isPending = false,
}: Readonly<ApiKeyRevokeDialogProps>) {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      data-slot="api-key-revoke-dialog"
      tone="destructive"
      title={t('ApiKeys.ConfirmRevoke')}
      description={t('ApiKeys.ConfirmRevokeDescription', { name: keyName })}
      confirmLabel={t('ApiKeys.ConfirmRevoke')}
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}
