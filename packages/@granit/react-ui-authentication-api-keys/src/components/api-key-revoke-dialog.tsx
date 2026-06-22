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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="api-key-revoke-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('ApiKeys.ConfirmRevoke')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('ApiKeys.ConfirmRevokeDescription', { name: keyName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('ApiKeys.ConfirmRevoke')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
