import { useTranslation } from '@granit/react-localization';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

interface ApiKeyRotateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  keyName: string;
  isPending?: boolean;
}

export function ApiKeyRotateDialog({
  open,
  onOpenChange,
  onConfirm,
  keyName,
  isPending = false,
}: Readonly<ApiKeyRotateDialogProps>) {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      data-slot="api-key-rotate-dialog"
      title={t('ApiKeys.ConfirmRotate')}
      description={t('ApiKeys.ConfirmRotateDescription', { name: keyName })}
      confirmLabel={t('ApiKeys.ConfirmRotate')}
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}
