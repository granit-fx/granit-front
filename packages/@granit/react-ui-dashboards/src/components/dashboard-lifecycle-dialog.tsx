import { useTranslation } from '@granit/react-localization';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

import { actionTitle, type PendingLifecycle } from './dashboard-lifecycle-types';

const LIFECYCLE_DIALOG_DEFAULTS: Record<
  'publish' | 'archive' | 'restore' | 'resync',
  { readonly title: string; readonly body: (name: string) => string; readonly confirm: string }
> = {
  publish: {
    title: 'Publish dashboard?',
    body: (name) =>
      `"${name}" will become visible to tenants assigned to this dashboard. You can archive it again later.`,
    confirm: 'Publish',
  },
  archive: {
    title: 'Archive dashboard?',
    body: (name) =>
      `"${name}" will be hidden from tenants. Existing references stay intact and you can restore it from the Archived filter.`,
    confirm: 'Archive',
  },
  restore: {
    title: 'Restore dashboard?',
    body: (name) =>
      `"${name}" will return to Draft status. Publish it again to expose it to tenants.`,
    confirm: 'Restore',
  },
  resync: {
    title: 'Re-sync dashboard?',
    body: (name) =>
      `"${name}" will be re-synced from its source definition. Layout and widgets are replayed; the dashboard name and status are preserved, and per-widget overrides are carried over by slug.`,
    confirm: 'Re-sync',
  },
};

interface LifecycleConfirmDialogProps {
  readonly pending: PendingLifecycle | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly isPending: boolean;
}

export function LifecycleConfirmDialog({
  pending,
  onCancel,
  onConfirm,
  isPending,
}: LifecycleConfirmDialogProps) {
  const { t } = useTranslation();
  if (!pending) {
    return (
      <ConfirmActionDialog
        open={false}
        onOpenChange={() => onCancel()}
        data-slot="dashboard-lifecycle-confirm"
        title=""
        confirmLabel=""
        onConfirm={onConfirm}
      />
    );
  }
  return (
    <ConfirmActionDialog
      open
      onOpenChange={(open) => !open && onCancel()}
      data-slot="dashboard-lifecycle-confirm"
      tone={pending.action === 'archive' ? 'destructive' : 'default'}
      isPending={isPending}
      title={t(`Dashboards.List.Confirm.${actionTitle(pending.action)}.Title`, {
        defaultValue: LIFECYCLE_DIALOG_DEFAULTS[pending.action].title,
      })}
      description={t(`Dashboards.List.Confirm.${actionTitle(pending.action)}.Body`, {
        name: pending.dashboard.name,
        defaultValue: LIFECYCLE_DIALOG_DEFAULTS[pending.action].body(pending.dashboard.name),
      })}
      confirmLabel={t(`Common.${actionTitle(pending.action)}`, {
        defaultValue: LIFECYCLE_DIALOG_DEFAULTS[pending.action].confirm,
      })}
      cancelLabel={t('Common.Cancel', { defaultValue: 'Cancel' })}
      onConfirm={onConfirm}
    />
  );
}
