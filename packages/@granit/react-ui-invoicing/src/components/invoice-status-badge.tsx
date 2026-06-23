import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { InvoiceStatus } from '@granit/invoicing';

const statusVariants: Record<InvoiceStatus, string> = {
  Draft: 'bg-muted/50 text-muted-foreground',
  Open: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  Paid: 'bg-success-500/15 text-success-600 border-success-500/25',
  Cancelled: 'bg-destructive/15 text-destructive border-destructive/25',
  Uncollectible: 'bg-destructive/15 text-destructive border-destructive/25',
};

interface InvoiceStatusBadgeProps {
  readonly status: string;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const variant = statusVariants[status as InvoiceStatus] ?? statusVariants.Draft;
  return (
    <Badge data-slot="invoice-status-badge" variant="outline" className={cn('text-xs', variant)}>
      {status}
    </Badge>
  );
}
