import { useImportReport } from '@granit/react-data-exchange';
import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@granit/react-ui';
import { Download } from 'lucide-react';

import { JobStatusBadge } from './job-status-badge';

import type { ImportJobResponse } from '@granit/data-exchange';

interface ImportReportDialogProps {
  readonly job: ImportJobResponse | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ImportReportDialog({ job, open, onOpenChange }: ImportReportDialogProps) {
  const { t } = useTranslation();
  const { report, downloadCorrection } = useImportReport(open ? (job?.id ?? undefined) : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="import-report-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('DataExchange.Report.Title')}</DialogTitle>
          <DialogDescription>{t('DataExchange.Report.Description')}</DialogDescription>
        </DialogHeader>

        {report.isLoading && (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        )}

        {report.data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{job?.originalFileName}</span>
              <JobStatusBadge status={report.data.finalStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">{t('DataExchange.Report.TotalRows')}</p>
                <p className="text-lg font-semibold">{report.data.totalRows}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">{t('DataExchange.Report.Succeeded')}</p>
                <p className="text-lg font-semibold text-green-600">{report.data.succeededRows}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">{t('DataExchange.Report.Failed')}</p>
                <p className="text-lg font-semibold text-destructive">{report.data.failedRows}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-muted-foreground">{t('DataExchange.Report.Skipped')}</p>
                <p className="text-lg font-semibold">{report.data.skippedRows}</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {t('DataExchange.Report.Duration')}: {report.data.duration}
            </div>

            {report.data.rowErrors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('DataExchange.Report.Errors')}</h4>
                <div className="max-h-48 overflow-y-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left">{t('DataExchange.Report.Row')}</th>
                        <th className="px-3 py-2 text-left">{t('DataExchange.Report.Kind')}</th>
                        <th className="px-3 py-2 text-left">{t('DataExchange.Report.Message')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.rowErrors.map((error, index) => (
                        <tr key={`${error.rowNumber}-${index}`} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              #{error.rowNumber}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary" className="text-xs">
                              {error.kind}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-destructive">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button variant="outline" size="sm" onClick={downloadCorrection}>
                  <Download className="mr-2 size-4" />
                  {t('DataExchange.Report.DownloadCorrection')}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
