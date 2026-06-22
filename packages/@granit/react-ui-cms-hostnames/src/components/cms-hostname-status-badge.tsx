import { Badge } from '@granit/react-ui';

type StatusVariant = 'secondary' | 'default' | 'destructive' | 'outline';

// SiteHostnameResponse.status is a free-form backend string; map the known
// values and fall back to a neutral variant for anything else.
const STATUS_VARIANT: Record<string, StatusVariant> = {
  Active: 'default',
  Pending: 'secondary',
  Verifying: 'outline',
  Error: 'destructive',
};

export interface CmsHostnameStatusBadgeProps {
  readonly status: string;
}

export function CmsHostnameStatusBadge({ status }: CmsHostnameStatusBadgeProps) {
  return (
    <Badge data-slot="cms-hostname-status-badge" variant={STATUS_VARIANT[status] ?? 'secondary'}>
      {status}
    </Badge>
  );
}
