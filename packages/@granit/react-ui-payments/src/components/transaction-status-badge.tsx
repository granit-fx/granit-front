import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { PaymentStatus } from '@granit/payments';

const statusConfig: Record<
  PaymentStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  Created: { variant: 'secondary' },
  RequiresAction: {
    variant: 'outline',
    className: 'border-blue-500 text-blue-600 dark:text-blue-400',
  },
  Processing: { variant: 'secondary' },
  Succeeded: { variant: 'default', className: 'bg-green-600 hover:bg-green-600/80 text-white' },
  Failed: { variant: 'destructive' },
  Canceled: { variant: 'outline' },
};

interface TransactionStatusBadgeProps {
  readonly status: PaymentStatus;
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const config = statusConfig[status] ?? { variant: 'secondary' as const };

  return (
    <Badge
      data-slot="transaction-status-badge"
      variant={config.variant}
      className={cn(config.className)}
    >
      {status}
    </Badge>
  );
}
