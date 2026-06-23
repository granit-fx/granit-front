import { Badge, Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { CheckCircle, Download, XCircle } from 'lucide-react';

import type { ImportReportResponse } from '@granit/data-exchange';

export interface ImportReportSummaryProps {
  readonly report: ImportReportResponse;
  /** Callback to download the correction file. */
  readonly onDownloadCorrection?: () => void;
}

function StatItem({
  label,
  value,
  className,
}: {
  readonly label: string;
  readonly value: number;
  readonly className?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('text-lg font-semibold', className)}>{value}</span>
    </div>
  );
}

/**
 * Summary card showing import results.
 */
export function ImportReportSummary({ report, onDownloadCorrection }: ImportReportSummaryProps) {
  const hasErrors = report.failedRows > 0;
  const isComplete = report.finalStatus === 'Completed';
  const isPartial = report.finalStatus === 'PartiallyCompleted';

  return (
    <div data-slot="import-report-summary" className="space-y-3">
      <div className="flex items-center gap-2">
        {isComplete ? (
          <CheckCircle
            className="h-5 w-5 text-success-600 dark:text-success-500"
            aria-hidden="true"
          />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
        )}
        <span className="font-medium">
          {isComplete && 'Import completed'}
          {isPartial && 'Partially completed'}
          {!isComplete && !isPartial && `Import ${report.finalStatus.toLowerCase()}`}
        </span>
        <Badge variant={isComplete ? 'default' : 'destructive'} className="text-xs">
          {report.duration}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        <StatItem label="Total rows" value={report.totalRows} />
        <StatItem
          label="Succeeded"
          value={report.succeededRows}
          className="text-success-600 dark:text-success-500"
        />
        <StatItem
          label="Failed"
          value={report.failedRows}
          className={cn(hasErrors && 'text-destructive')}
        />
        <StatItem label="Skipped" value={report.skippedRows} />
        <StatItem label="Inserted" value={report.insertedRows} />
        <StatItem label="Updated" value={report.updatedRows} />
      </div>

      {hasErrors && onDownloadCorrection && (
        <Button variant="outline" size="sm" onClick={onDownloadCorrection}>
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Download correction file
        </Button>
      )}
    </div>
  );
}
