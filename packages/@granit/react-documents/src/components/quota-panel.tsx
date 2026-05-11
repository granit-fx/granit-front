import { useTenantStorageQuota } from '../hooks/use-quota.js';

import { formatBytes } from './format-bytes.js';

import type { ReactNode } from 'react';

export interface QuotaPanelLabels {
  readonly title?: string;
  readonly used?: string;
  readonly limit?: string;
  readonly percentUsed?: string;
  readonly updatedAt?: string;
  readonly loading?: string;
}

export interface QuotaPanelProps {
  readonly labels?: QuotaPanelLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<QuotaPanelLabels> = {
  title: 'Storage usage',
  used: 'Used',
  limit: 'Limit',
  percentUsed: '% used',
  updatedAt: 'Updated',
  loading: 'Loading quota…',
};

/**
 * Tenant storage usage panel — labelled progress bar plus the raw figures
 * (used / limit) formatted via {@link formatBytes}. The hook lazily creates
 * the quota row server-side, so new tenants render `0 B` rather than an error.
 */
export function QuotaPanel({ labels, className }: QuotaPanelProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const query = useTenantStorageQuota();

  if (query.isLoading || !query.data) {
    return (
      <div data-granit-quota-panel="" data-granit-quota-panel-loading="" className={className}>
        {labelStrings.loading}
      </div>
    );
  }

  const { usageBytes, limitBytes, percentUsed, updatedAt } = query.data;

  return (
    <div data-granit-quota-panel="" className={className}>
      <header data-granit-quota-panel-header="">
        <h3>{labelStrings.title}</h3>
      </header>
      <div
        data-granit-quota-panel-bar=""
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentUsed)}
      >
        <div
          data-granit-quota-panel-bar-fill=""
          style={{ width: `${Math.min(percentUsed, 100).toString()}%` }}
        />
      </div>
      <dl data-granit-quota-panel-meta="">
        <dt>{labelStrings.used}</dt>
        <dd>{formatBytes(usageBytes)}</dd>
        <dt>{labelStrings.limit}</dt>
        <dd>{formatBytes(limitBytes)}</dd>
        <dt>{labelStrings.percentUsed}</dt>
        <dd>{percentUsed.toFixed(1)}</dd>
        <dt>{labelStrings.updatedAt}</dt>
        <dd>{updatedAt}</dd>
      </dl>
    </div>
  );
}
