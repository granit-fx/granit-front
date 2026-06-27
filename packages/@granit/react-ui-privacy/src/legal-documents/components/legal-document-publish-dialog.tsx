import { useTranslation } from '@granit/react-localization';
import { usePublishLegalDocument } from '@granit/react-privacy';
import { toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

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
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Privacy.LegalDocuments.PublishTitle')}
      description={t('Privacy.LegalDocuments.PublishConfirm', { name: displayName })}
      confirmLabel={t('Privacy.LegalDocuments.Publish')}
      busyLabel={t('Common.Loading')}
      isPending={publishMutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
