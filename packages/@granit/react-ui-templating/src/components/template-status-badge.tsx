import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { cva } from 'class-variance-authority';

import type { WorkflowLifecycleStatus } from '@granit/templating';

const templateStatusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        Draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        PendingReview: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        Published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        Archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
    },
    defaultVariants: {
      status: 'Draft',
    },
  }
);

const STATUS_LABELS: Record<WorkflowLifecycleStatus, string> = {
  Draft: 'Templates.Status.Draft',
  PendingReview: 'Templates.Status.PendingReview',
  Published: 'Templates.Status.Published',
  Archived: 'Templates.Status.Archived',
};

interface TemplateStatusBadgeProps {
  status: WorkflowLifecycleStatus;
  className?: string;
}

export function TemplateStatusBadge({ status, className }: Readonly<TemplateStatusBadgeProps>) {
  const { t } = useTranslation();

  return (
    <span
      data-slot="template-status-badge"
      className={cn(templateStatusBadgeVariants({ status }), className)}
    >
      {t(STATUS_LABELS[status])}
    </span>
  );
}
