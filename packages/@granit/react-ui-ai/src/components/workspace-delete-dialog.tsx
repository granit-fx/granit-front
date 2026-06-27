import { AI_WORKSPACE_KINDS } from '@granit/ai';
import { useTranslation } from '@granit/react-localization';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

import type { AIWorkspaceResponse } from '@granit/ai';

interface WorkspaceDeleteDialogProps {
  workspace: AIWorkspaceResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function WorkspaceDeleteDialog({
  workspace,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Readonly<WorkspaceDeleteDialogProps>) {
  const { t } = useTranslation();

  const isSystem = workspace?.kind === AI_WORKSPACE_KINDS.SYSTEM;

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('AI.Workspaces.DeleteDialog.Title')}
      description={
        isSystem
          ? t('AI.Workspaces.DeleteDialog.SystemWarning', { name: workspace?.key })
          : t('AI.Workspaces.DeleteDialog.Description', { name: workspace?.key })
      }
      confirmLabel={t('Common.Delete')}
      busyLabel={isSystem ? t('Common.Delete') : '...'}
      isPending={isPending || isSystem}
      onConfirm={onConfirm}
    />
  );
}
