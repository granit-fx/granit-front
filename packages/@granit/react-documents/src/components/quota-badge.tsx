import { formatBytes } from '@granit/utils';

import { useTenantStorageQuota } from '../hooks/use-quota';

import type { ReactNode } from 'react';

export interface QuotaBadgeLabels {
  readonly loading?: string;
}

export interface QuotaBadgeProps {
  readonly labels?: QuotaBadgeLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<QuotaBadgeLabels> = {
  loading: '…',
};

/**
 * One-liner storage badge for app headers: `"5.2 GB / 10 GB (52%)"` with a
 * thin progress bar underneath. Shares the {@link useTenantStorageQuota}
 * hook with {@link QuotaPanel}; React Query deduplicates the request.
 */
export function QuotaBadge({ labels, className }: QuotaBadgeProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const query = useTenantStorageQuota();

  if (query.isLoading || !query.data) {
    return (
      <span data-granit-quota-badge="" data-granit-quota-badge-loading="" className={className}>
        {labelStrings.loading}
      </span>
    );
  }

  const { usageBytes, limitBytes, percentUsed } = query.data;

  return (
    <span data-granit-quota-badge="" className={className}>
      <span data-granit-quota-badge-text="">
        {formatBytes(usageBytes)} / {formatBytes(limitBytes)} ({percentUsed.toFixed(0)}%)
      </span>
      <span
        data-granit-quota-badge-bar=""
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentUsed)}
      >
        <span
          data-granit-quota-badge-bar-fill=""
          style={{ width: `${Math.min(percentUsed, 100).toString()}%` }}
        />
      </span>
    </span>
  );
}
