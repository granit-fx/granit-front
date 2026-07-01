import { usePermissions } from '@granit/react-authorization';
import { TrashBin } from '@granit/react-documents';
import { useTranslation } from '@granit/react-localization';

import { DOCUMENTS_PERMISSIONS } from '../constants';

export function TrashBinPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(DOCUMENTS_PERMISSIONS.Documents.Manage);

  return (
    <div data-slot="trash-bin-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:Trash.Title', 'Trash')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'documents:Trash.Subtitle',
            'Restore trashed documents or permanently delete them before automatic purge.'
          )}
        </p>
      </header>

      <TrashBin
        canManage={canManage}
        labels={{
          title: t('documents:Trash.Title', 'Trash'),
          empty: t('documents:Trash.Empty', 'Trash is empty.'),
          loading: t('documents:Trash.Loading', 'Loading trash…'),
          nameHeader: t('documents:Trash.NameHeader', 'Name'),
          trashedAtHeader: t('documents:Trash.TrashedAtHeader', 'Trashed'),
          countdownHeader: t('documents:Trash.CountdownHeader', 'Auto-deletion'),
          daysRemaining: t('documents:Trash.DaysRemaining', 'days left'),
          restore: t('documents:Trash.Restore', 'Restore'),
          permanentlyDelete: t('documents:Trash.PermanentlyDelete', 'Permanently delete'),
          permanentlyDeleteConfirm: t(
            'documents:Trash.PermanentlyDeleteConfirm',
            'Permanently delete this document? This cannot be undone.'
          ),
          previous: t('documents:Trash.Previous', 'Previous'),
          next: t('documents:Trash.Next', 'Next'),
        }}
      />
    </div>
  );
}
