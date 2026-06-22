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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="api-key-rotate-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('ApiKeys.ConfirmRotate')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('ApiKeys.ConfirmRotateDescription', { name: keyName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {t('ApiKeys.ConfirmRotate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
