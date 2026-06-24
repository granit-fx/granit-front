import { useTranslation } from '@granit/react-localization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@granit/react-ui';

import { formatCurrency } from '@granit/utils';

import type { InvoiceLineItemResponse } from '@granit/invoicing';

interface InvoiceLineItemsProps {
  readonly lineItems: readonly InvoiceLineItemResponse[];
  readonly currency: string;
}

export function InvoiceLineItems({ lineItems, currency }: InvoiceLineItemsProps) {
  const { t, i18n } = useTranslation();

  if (lineItems.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('Invoicing.Detail.NoLineItems')}</p>;
  }

  return (
    <div data-slot="invoice-line-items" className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Invoicing.LineItems.Description')}</TableHead>
            <TableHead className="text-right">{t('Invoicing.LineItems.Quantity')}</TableHead>
            <TableHead className="text-right">{t('Invoicing.LineItems.UnitPrice')}</TableHead>
            <TableHead className="text-right">{t('Invoicing.LineItems.Amount')}</TableHead>
            <TableHead className="text-right">{t('Invoicing.LineItems.Tax')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-sm">{item.description}</TableCell>
              <TableCell className="text-right text-sm">{item.quantity}</TableCell>
              <TableCell className="text-right text-sm">
                {formatCurrency(item.unitPrice, currency, i18n.language)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatCurrency(item.amount, currency, i18n.language)}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {item.taxRate}% ({formatCurrency(item.taxAmount, currency, i18n.language)})
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
