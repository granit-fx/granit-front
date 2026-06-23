import { AI_WORKSPACE_KINDS } from '@granit/ai';
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('AI.Workspaces.DeleteDialog.Title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSystem
              ? t('AI.Workspaces.DeleteDialog.SystemWarning', { name: workspace?.key })
              : t('AI.Workspaces.DeleteDialog.Description', { name: workspace?.key })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending || isSystem}>
            {isPending ? '...' : t('Common.Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
