import { useTranslation } from '@granit/react-localization';
import { usePublishLegalDocument } from '@granit/react-privacy';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from '@granit/react-ui';

interface LegalDocumentPublishDialogProps {
  readonly documentId: string;
  readonly displayName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function LegalDocumentPublishDialog({
  documentId,
  displayName,
  open,
  onOpenChange,
}: LegalDocumentPublishDialogProps) {
  const { t } = useTranslation();
  const publishMutation = usePublishLegalDocument();

  function handleConfirm() {
    publishMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success(t('Privacy.LegalDocuments.PublishSuccess'));
        onOpenChange(false);
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Privacy.LegalDocuments.PublishTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Privacy.LegalDocuments.PublishConfirm', { name: displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? t('Common.Loading') : t('Privacy.LegalDocuments.Publish')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
