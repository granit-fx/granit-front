import { useDownloadInvoicePdf } from '@granit/react-invoicing';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { Download } from 'lucide-react';

import type { InvoiceId } from '@granit/invoicing';

interface DownloadPdfButtonProps {
  readonly invoiceId: InvoiceId;
  readonly invoiceNumber?: string;
}

export function DownloadPdfButton({ invoiceId, invoiceNumber }: DownloadPdfButtonProps) {
  const { t } = useTranslation();
  const download = useDownloadInvoicePdf();

  async function handleDownload() {
    const blob = await download.mutateAsync(invoiceId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceNumber ?? invoiceId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      data-slot="download-pdf-button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={download.isPending}
    >
      <Download className="mr-2 h-4 w-4" />
      {download.isPending ? t('Common.Loading') : t('Invoicing.DownloadPdf')}
    </Button>
  );
}
