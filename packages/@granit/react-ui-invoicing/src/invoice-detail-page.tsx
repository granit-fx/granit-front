import { useInvoice } from '@granit/react-invoicing';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { DownloadPdfButton } from './components/download-pdf-button';
import { InvoiceLineItems } from './components/invoice-line-items';
import { InvoiceStatusBadge } from './components/invoice-status-badge';
import { formatCurrency } from '@granit/utils';

import type { InvoiceId, InvoiceResponse } from '@granit/invoicing';

interface InvoiceDetailPageProps {
  /**
   * Host slot for the entity workflow panel rendered below the line items.
   * The package does not own the workflow component (`EntityWorkflow` is a host
   * concern); the showcase wrapper injects it and passes `INVOICE_WORKFLOW_STATES`.
   */
  readonly renderWorkflow?: (invoice: InvoiceResponse) => React.ReactNode;
}

export function InvoiceDetailPage({ renderWorkflow }: InvoiceDetailPageProps) {
  const { t, i18n } = useTranslation();
  const { formatDate, formatDateTime } = useDateFormatter();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const invoiceId = id ? (toEntityId<'Invoice'>(id) as InvoiceId) : '';
  const { data: invoice, isLoading } = useInvoice(invoiceId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('Invoicing.Detail.NotFound')}</h2>
        <p className="text-muted-foreground">{t('Invoicing.Detail.NotFoundMessage')}</p>
        <Button variant="outline" onClick={() => navigate('/invoicing')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('Invoicing.Detail.BackToList')}
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="invoice-detail-page" className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoicing')}>
          <ArrowLeft className="mr-1 size-4" />
          {t('Invoicing.Detail.BackToList')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{invoice.invoiceNumber}</h2>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-muted-foreground">{invoice.documentType}</p>
        </div>
        <DownloadPdfButton
          invoiceId={toEntityId<'Invoice'>(invoice.id)}
          invoiceNumber={invoice.invoiceNumber ?? undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Invoicing.Detail.Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={t('Invoicing.Detail.InvoiceNumber')}
              value={<span className="font-mono">{invoice.invoiceNumber}</span>}
            />
            <InfoRow label={t('Invoicing.Detail.DocumentType')} value={invoice.documentType} />
            <InfoRow
              label={t('Invoicing.Detail.CollectionMethod')}
              value={invoice.collectionMethod}
            />
            <InfoRow label={t('Invoicing.Detail.BillingReason')} value={invoice.billingReason} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Invoicing.Detail.Amounts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={t('Invoicing.Detail.Subtotal')}
              value={formatCurrency(invoice.subtotal, invoice.currency, i18n.language)}
            />
            <InfoRow
              label={t('Invoicing.Detail.Tax')}
              value={formatCurrency(invoice.taxTotal, invoice.currency, i18n.language)}
            />
            <InfoRow
              label={t('Invoicing.Detail.Total')}
              value={
                <span className="font-semibold">
                  {formatCurrency(invoice.total, invoice.currency, i18n.language)}
                </span>
              }
            />
            <InfoRow
              label={t('Invoicing.Detail.AmountPaid')}
              value={formatCurrency(invoice.amountPaid, invoice.currency, i18n.language)}
            />
            <InfoRow
              label={t('Invoicing.Detail.AmountRemaining')}
              value={
                <span className="font-semibold">
                  {formatCurrency(invoice.amountRemaining, invoice.currency, i18n.language)}
                </span>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Invoicing.Detail.Dates')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={t('Invoicing.Detail.IssuedAt')}
              value={invoice.issuedAt ? formatDateTime(invoice.issuedAt) : '—'}
            />
            <InfoRow
              label={t('Invoicing.Detail.DueAt')}
              value={invoice.dueAt ? formatDate(invoice.dueAt) : '—'}
            />
            <InfoRow
              label={t('Invoicing.Detail.PaidAt')}
              value={invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Invoicing.Detail.LineItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItems lineItems={[...invoice.lineItems]} currency={invoice.currency} />
        </CardContent>
      </Card>

      {renderWorkflow?.(invoice)}
    </div>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
