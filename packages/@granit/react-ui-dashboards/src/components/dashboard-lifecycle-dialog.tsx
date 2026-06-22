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
  return (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent data-slot="dashboard-lifecycle-confirm" data-action={pending?.action}>
        {pending ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t(`Dashboards.List.Confirm.${actionTitle(pending.action)}.Title`, {
                  defaultValue: LIFECYCLE_DIALOG_DEFAULTS[pending.action].title,
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(`Dashboards.List.Confirm.${actionTitle(pending.action)}.Body`, {
                  name: pending.dashboard.name,
                  defaultValue: LIFECYCLE_DIALOG_DEFAULTS[pending.action].body(
                    pending.dashboard.name
                  ),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t('Common.Cancel', { defaultValue: 'Cancel' })}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  onConfirm();
                }}
                disabled={isPending}
                className={
                  pending.action === 'archive'
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : undefined
                }
              >
                {t(`Common.${actionTitle(pending.action)}`, {
                  defaultValue: LIFECYCLE_DIALOG_DEFAULTS[pending.action].confirm,
                })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
