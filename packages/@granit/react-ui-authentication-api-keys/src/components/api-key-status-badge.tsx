import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { cva } from 'class-variance-authority';

import type { ApiKeyStatus } from './api-key-status-utils';

const apiKeyStatusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        revoked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        expired: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      },
    },
    defaultVariants: {
      status: 'active',
    },
  }
);

const STATUS_LABELS: Record<ApiKeyStatus, string> = {
  active: 'ApiKeys.Active',
  revoked: 'ApiKeys.Revoked',
  expired: 'ApiKeys.Expired',
};

interface ApiKeyStatusBadgeProps {
  status: ApiKeyStatus;
  className?: string;
}

export function ApiKeyStatusBadge({ status, className }: Readonly<ApiKeyStatusBadgeProps>) {
  const { t } = useTranslation();

  return (
    <span
      data-slot="api-key-status-badge"
      className={cn(apiKeyStatusBadgeVariants({ status }), className)}
    >
      {t(STATUS_LABELS[status])}
    </span>
  );
}
