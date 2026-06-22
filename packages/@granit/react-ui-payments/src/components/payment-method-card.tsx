import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { PaymentMethodIcon } from '@granit/react-payments';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { MoreVertical } from 'lucide-react';

import { methodTypeCategoryIndex } from '../payment-method-category';

import type { PaymentMethodResponse } from '@granit/payments';

interface PaymentMethodCardProps {
  readonly method: PaymentMethodResponse;
  readonly onDetach: (method: PaymentMethodResponse) => void;
}

export function PaymentMethodCard({ method, onDetach }: PaymentMethodCardProps) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();

  return (
    <Card data-slot="payment-method-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <PaymentMethodIcon
            methodType={method.type}
            category={methodTypeCategoryIndex(method.type)}
            size={24}
            title={method.displayLabel}
          />
          <CardTitle className="text-sm font-medium">{method.displayLabel}</CardTitle>
          {method.isDefault && <Badge variant="secondary">{t('Payments.Methods.Default')}</Badge>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('Common.Actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={() => onDetach(method)}>
              {t('Payments.Methods.Detach')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{method.providerName}</p>
          {method.expiresAt && (
            <p>
              {t('Payments.Methods.Expires')} {formatDate(method.expiresAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
