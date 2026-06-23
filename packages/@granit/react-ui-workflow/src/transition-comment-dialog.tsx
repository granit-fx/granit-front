
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@granit/react-ui';
import { useState } from 'react';

export interface TransitionCommentDialogProps {
  open: boolean;
  transitionName: string;
  requiresApproval: boolean;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
}

/**
 * Dialog shown before executing a workflow transition.
 * Allows the user to attach an optional comment (max 2000 chars).
 * When approval is required, the dialog title reflects the approval request.
 */
export function TransitionCommentDialog({
  open,
  transitionName,
  requiresApproval,
  onConfirm,
  onCancel,
}: Readonly<TransitionCommentDialogProps>) {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    onConfirm(comment.trim() || undefined);
    setComment('');
  };

  const handleCancel = () => {
    onCancel();
    setComment('');
  };

  const title = requiresApproval
    ? t('Workflow.ApprovalDialogTitle')
    : t('Workflow.TransitionDialogTitle', { name: transitionName });

  const description = requiresApproval
    ? t('Workflow.ApprovalDialogDescription')
    : t('Workflow.TransitionDialogDescription');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('Workflow.CommentPlaceholder')}
          maxLength={2000}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('Workflow.Cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {requiresApproval ? t('Workflow.RequestApproval') : t('Workflow.Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
