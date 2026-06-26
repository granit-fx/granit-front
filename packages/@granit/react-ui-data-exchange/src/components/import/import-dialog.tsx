import { useImportJob, useImportPreview, useImportReport } from '@granit/react-data-exchange';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
  Spinner,
} from '@granit/react-ui';
import { AlertTriangle, CheckCircle, Loader2, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ColumnMappingTable } from './column-mapping-table';
import { FileDropZone } from './file-drop-zone';
import { ImportReportSummary } from './import-report-summary';
import { ImportRowErrors } from './import-row-errors';

import type { ImportJobStatus } from '@granit/data-exchange';

export interface ImportDialogProps {
  /** The import definition name. */
  readonly definitionName: string;
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Callback when the dialog open state changes. */
  readonly onOpenChange: (open: boolean) => void;
  /** Accepted file types. Defaults to `['.csv', '.xlsx', '.xls']`. */
  readonly accept?: readonly string[];
}

type ImportStep = 'upload' | 'map' | 'execute' | 'report';

const STATUS_ICONS: Record<ImportJobStatus, 'loading' | 'success' | 'error' | 'warning'> = {
  Created: 'loading',
  Previewed: 'loading',
  Mapped: 'success',
  Executing: 'loading',
  Completed: 'success',
  PartiallyCompleted: 'warning',
  Failed: 'error',
  Cancelled: 'error',
};

/**
 * Import wizard dialog.
 *
 * Four-step workflow: Upload -> Map columns -> Execute -> Report.
 */
export function ImportDialog({
  definitionName,
  open,
  onOpenChange,
  accept = ['.csv', '.xlsx', '.xls'],
}: ImportDialogProps) {
  const { t } = useTranslation();

  const STEP_LABELS: Record<ImportStep, string> = {
    upload: t('DataExchange.Import.StepUpload'),
    map: t('DataExchange.Import.StepMap'),
    execute: t('DataExchange.Import.StepExecute'),
    report: t('DataExchange.Import.StepReport'),
  };

  const importJob = useImportJob();
  const importPreview = useImportPreview();
  const importReport = useImportReport(importJob.isTerminal ? importJob.job?.id : undefined);

  const [step, setStep] = useState<ImportStep>('upload');

  // Wrap onOpenChange to reset state when dialog closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setStep('upload');
        importJob.reset();
        importPreview.reset();
      }
      onOpenChange(nextOpen);
    },
    [importJob, importPreview, onOpenChange]
  );

  // Handle file upload
  const handleFileSelect = useCallback(
    (file: File) => {
      importJob.upload(file, definitionName);
    },
    [definitionName, importJob]
  );

  // After upload succeeds, trigger preview
  const lastPreviewedJobIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      importJob.job?.status === 'Created' &&
      step === 'upload' &&
      importJob.job.id !== lastPreviewedJobIdRef.current
    ) {
      lastPreviewedJobIdRef.current = importJob.job.id;
      importPreview.preview(importJob.job.id);
    }
  }, [importJob.job?.status, importJob.job?.id, step, importPreview]);

  // Derive step: after preview succeeds, move to map step
  let derivedStep: ImportStep = step;
  if (importPreview.headers.length > 0 && step === 'upload') {
    derivedStep = 'map';
  } else if (importJob.isTerminal && step === 'execute') {
    derivedStep = 'report';
  }

  if (derivedStep !== step) {
    setStep(derivedStep);
  }

  const handleConfirmMappings = useCallback(() => {
    importJob.confirmMap(importPreview.mappings);
    setStep('execute');
  }, [importJob, importPreview.mappings]);

  const handleExecute = useCallback(() => {
    importJob.execute();
  }, [importJob]);

  const handleDryRun = useCallback(() => {
    if (importJob.job) {
      importPreview.dryRun(importJob.job.id);
    }
  }, [importJob.job, importPreview]);

  const isUploading = importJob.isUploading || importPreview.isPreviewing;
  const jobStatus = importJob.job?.status;
  const statusIcon = jobStatus ? STATUS_ICONS[jobStatus] : undefined;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-slot="import-dialog"
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{t('DataExchange.Import.Label')}</DialogTitle>
          <DialogDescription>
            {STEP_LABELS[step]}
            {importJob.job && (
              <span className="ml-2 text-muted-foreground">— {importJob.job.originalFileName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1">
          {(['upload', 'map', 'execute', 'report'] as const).map((s, i, arr) => {
            const currentIndex = arr.indexOf(step);
            const isPast = i < currentIndex;
            let stepClass = 'bg-muted';
            if (s === step) stepClass = 'bg-primary';
            else if (isPast) stepClass = 'bg-primary/40';
            return <div key={s} className={`h-1 flex-1 rounded-full ${stepClass}`} />;
          })}
        </div>

        <div className="space-y-4">
          {/* Step: Upload */}
          {step === 'upload' && (
            <>
              <FileDropZone
                accept={accept}
                onFileSelect={handleFileSelect}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  <span>{t('DataExchange.Import.Uploading')}</span>
                </div>
              )}
            </>
          )}

          {/* Step: Map columns */}
          {step === 'map' && (
            <>
              <ColumnMappingTable
                mappings={importPreview.mappings}
                fieldMetadata={importPreview.fieldMetadata}
                previewRows={importPreview.previewRows}
                headers={importPreview.headers}
                onMappingChange={importPreview.updateMapping}
                disabled={importJob.isConfirming}
              />
              {importPreview.dryRunReport && (
                <>
                  <Separator />
                  <ImportReportSummary report={importPreview.dryRunReport} />
                  {importPreview.dryRunReport.rowErrors.length > 0 && (
                    <ImportRowErrors errors={importPreview.dryRunReport.rowErrors} />
                  )}
                </>
              )}
            </>
          )}

          {/* Step: Execute */}
          {step === 'execute' && (
            <div className="flex flex-col items-center gap-4 py-8">
              {importJob.isExecuting && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    {t('DataExchange.Import.InProgress')}
                  </p>
                </>
              )}
              {!importJob.isExecuting && importJob.job?.status === 'Mapped' && (
                <>
                  <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
                  <p className="text-sm">{t('DataExchange.Import.MappingsConfirmed')}</p>
                </>
              )}
              {!importJob.isExecuting && importJob.job?.status !== 'Mapped' && (
                <>
                  {statusIcon === 'loading' && (
                    <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                  )}
                  {statusIcon === 'success' && (
                    <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
                  )}
                  {statusIcon === 'warning' && (
                    <AlertTriangle className="h-8 w-8 text-warning" aria-hidden="true" />
                  )}
                  {statusIcon === 'error' && (
                    <X className="h-8 w-8 text-destructive" aria-hidden="true" />
                  )}
                  <p className="text-sm">{jobStatus}</p>
                </>
              )}
            </div>
          )}

          {/* Step: Report */}
          {step === 'report' && importReport.report.data && (
            <>
              <ImportReportSummary
                report={importReport.report.data}
                onDownloadCorrection={
                  importReport.report.data.failedRows > 0
                    ? importReport.downloadCorrection
                    : undefined
                }
              />
              {importReport.report.data.rowErrors.length > 0 && (
                <ImportRowErrors errors={importReport.report.data.rowErrors} />
              )}
            </>
          )}

          {step === 'report' && importReport.report.isLoading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Spinner />
              <span className="text-sm text-muted-foreground">
                {t('DataExchange.Import.LoadingReport')}
              </span>
            </div>
          )}

          {/* Error display */}
          {(importJob.error ?? importPreview.error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {(importJob.error ?? importPreview.error)?.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              {t('Common.Close')}
            </Button>

            {step === 'map' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDryRun}
                  disabled={importPreview.isDryRunning}
                >
                  {importPreview.isDryRunning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {t('DataExchange.Import.DryRun')}
                </Button>
                <Button onClick={handleConfirmMappings} disabled={importJob.isConfirming}>
                  {t('DataExchange.Import.ConfirmMappings')}
                </Button>
              </>
            )}

            {step === 'execute' && importJob.job?.status === 'Mapped' && (
              <Button onClick={handleExecute} disabled={importJob.isExecuting}>
                {importJob.isExecuting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {t('DataExchange.Import.ExecuteImport')}
              </Button>
            )}

            {step === 'execute' && importJob.isPolling && (
              <Button variant="destructive" onClick={() => importJob.cancel()}>
                {t('Common.Cancel')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
