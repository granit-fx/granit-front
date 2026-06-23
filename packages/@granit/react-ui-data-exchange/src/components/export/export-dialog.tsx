import {
  useExportDefinitions,
  useExportFields,
  useExportJob,
  useExportPresets,
} from '@granit/react-data-exchange';
import { useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Switch,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { ArrowDown, ArrowUp, Check, Download, Loader2, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ExportFieldResponse,
  ExportJobStatus,
  ExportPresetResponse,
} from '@granit/data-exchange';

export interface ExportDialogProps {
  /** The export definition name. */
  readonly definitionName: string;
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Callback when the dialog open state changes. */
  readonly onOpenChange: (open: boolean) => void;
  /** Override supported export formats. When omitted, fetched from the backend definition. */
  readonly formats?: readonly string[];
  /** Current sort specification to pass to the export job. */
  readonly sort?: string;
  /** Current filter criteria to pass to the export job. */
  readonly filter?: Readonly<Record<string, string>>;
  /** Current active presets to pass to the export job. */
  readonly presets?: Readonly<Record<string, string>>;
  /** Current search term to pass to the export job. */
  readonly search?: string;
}

interface FieldSelection {
  readonly propertyPath: string;
  readonly selected: boolean;
}

/**
 * Export configuration dialog.
 *
 * Allows the user to select fields, choose a format, toggle roundtrip mode,
 * load/save presets, and start an export job with progress tracking.
 */
export function ExportDialog({
  definitionName,
  open,
  onOpenChange,
  formats: formatsProp,
  sort,
  filter,
  presets,
  search,
}: ExportDialogProps) {
  const { t } = useTranslation();

  const STATUS_LABELS: Record<ExportJobStatus, string> = {
    Queued: t('DataExchange.Export.StatusQueued'),
    Exporting: t('DataExchange.Export.StatusExporting'),
    Completed: t('DataExchange.Export.StatusCompleted'),
    Failed: t('DataExchange.Export.StatusFailed'),
  };

  const definitionsQuery = useExportDefinitions();
  const fieldsQuery = useExportFields(open ? definitionName : undefined);
  const exportJob = useExportJob();
  const exportPresets = useExportPresets(open ? definitionName : undefined);

  // Resolve formats: prop override > backend definition > empty
  const formats = useMemo(() => {
    if (formatsProp) return formatsProp;
    const def = definitionsQuery.data?.find((d) => d.name === definitionName);
    return def?.supportedFormats ?? [];
  }, [formatsProp, definitionsQuery.data, definitionName]);

  // Local state
  const [selectedFields, setSelectedFields] = useState<FieldSelection[]>([]);
  const [format, setFormat] = useState<string>('');
  const [includeIdForImport, setIncludeIdForImport] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Set default format when formats resolve (from backend or prop)
  useEffect(() => {
    const defaultFormat = formats[0];
    if (defaultFormat && !format) {
      setFormat(defaultFormat);
    }
  }, [formats, format]);

  // Initialize field selection when fields load (ref guard prevents re-init on user edits)
  const lastFieldsRef = useRef<readonly ExportFieldResponse[] | undefined>(undefined);
  useEffect(() => {
    if (fieldsQuery.data && fieldsQuery.data !== lastFieldsRef.current) {
      lastFieldsRef.current = fieldsQuery.data;
      setSelectedFields(
        [...fieldsQuery.data]
          .sort((a, b) => a.order - b.order)
          .map((f) => ({ propertyPath: f.propertyPath, selected: true }))
      );
    }
  }, [fieldsQuery.data]);

  // Wrap onOpenChange to reset state when dialog closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        exportJob.reset();
        setShowSavePreset(false);
        setPresetName('');
      }
      onOpenChange(nextOpen);
    },
    [exportJob, onOpenChange]
  );

  const fieldsMap = useMemo(() => {
    if (!fieldsQuery.data) return new Map<string, ExportFieldResponse>();
    return new Map(fieldsQuery.data.map((f) => [f.propertyPath, f]));
  }, [fieldsQuery.data]);

  const selectedCount = selectedFields.filter((f) => f.selected).length;
  const allSelected = selectedFields.length > 0 && selectedCount === selectedFields.length;

  const toggleField = useCallback((propertyPath: string) => {
    setSelectedFields((prev) =>
      prev.map((f) => (f.propertyPath === propertyPath ? { ...f, selected: !f.selected } : f))
    );
  }, []);

  const toggleAll = useCallback(() => {
    const newSelected = !allSelected;
    setSelectedFields((prev) => prev.map((f) => ({ ...f, selected: newSelected })));
  }, [allSelected]);

  const moveField = useCallback((index: number, direction: 'up' | 'down') => {
    setSelectedFields((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const current = next[index];
      const target = next[targetIndex];
      if (!current || !target) return prev;
      next[index] = target;
      next[targetIndex] = current;
      return next;
    });
  }, []);

  const loadPreset = useCallback((preset: ExportPresetResponse) => {
    setFormat(preset.format);
    setIncludeIdForImport(preset.includeIdForImport);
    setSelectedFields((prev) => {
      const selectedSet = new Set(preset.selectedFields);
      const ordered: FieldSelection[] = [];
      // First, add fields in preset order
      for (const path of preset.selectedFields) {
        if (prev.some((f) => f.propertyPath === path)) {
          ordered.push({ propertyPath: path, selected: true });
        }
      }
      // Then, add remaining fields as unselected
      for (const f of prev) {
        if (!selectedSet.has(f.propertyPath)) {
          ordered.push({ propertyPath: f.propertyPath, selected: false });
        }
      }
      return ordered;
    });
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;
    const fields = selectedFields.filter((f) => f.selected).map((f) => f.propertyPath);
    exportPresets.save.mutate({
      definitionName,
      presetName: presetName.trim(),
      selectedFields: fields,
      format,
      includeIdForImport,
    });
    setShowSavePreset(false);
    setPresetName('');
  }, [definitionName, exportPresets.save, format, includeIdForImport, presetName, selectedFields]);

  const handleExport = useCallback(() => {
    const fields = selectedFields.filter((f) => f.selected).map((f) => f.propertyPath);

    exportJob.startExport({
      definitionName,
      format,
      selectedFields: fields.length > 0 ? fields : null,
      includeIdForImport,
      sort: sort ?? null,
      filter: filter ?? null,
      presets: presets ?? null,
      search: search ?? null,
    });
  }, [
    definitionName,
    exportJob,
    filter,
    format,
    includeIdForImport,
    presets,
    search,
    selectedFields,
    sort,
  ]);

  const isJobActive = exportJob.isCreating || exportJob.isExporting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-slot="export-dialog" className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('DataExchange.Export.Label')}</DialogTitle>
          <DialogDescription>{t('DataExchange.Export.Description')}</DialogDescription>
        </DialogHeader>

        {fieldsQuery.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Presets */}
            {exportPresets.presets.data && exportPresets.presets.data.length > 0 && (
              <div data-slot="export-presets" className="space-y-2">
                <Label className="text-sm font-medium">{t('DataExchange.Export.Presets')}</Label>
                <div className="flex flex-wrap gap-2">
                  {exportPresets.presets.data.map((preset) => (
                    <div key={preset.presetName} className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => loadPreset(preset)}>
                        {preset.presetName}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => exportPresets.remove.mutate(preset.presetName)}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">{t('DataExchange.Export.DeletePreset')}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format selection */}
            <div data-slot="export-format" className="space-y-2">
              <Label htmlFor="export-format">{t('DataExchange.Export.Format')}</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Roundtrip toggle */}
            <div data-slot="export-roundtrip" className="flex items-center justify-between">
              <Label htmlFor="export-roundtrip">{t('DataExchange.Export.IncludeId')}</Label>
              <Switch
                id="export-roundtrip"
                checked={includeIdForImport}
                onCheckedChange={setIncludeIdForImport}
              />
            </div>

            <Separator />

            {/* Field selection */}
            <div data-slot="export-fields" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('DataExchange.Export.Columns', {
                    selected: selectedCount,
                    total: selectedFields.length,
                  })}
                </Label>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {allSelected
                    ? t('DataExchange.Export.DeselectAll')
                    : t('DataExchange.Export.SelectAll')}
                </Button>
              </div>
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2">
                {selectedFields.map((field, index) => {
                  const descriptor = fieldsMap.get(field.propertyPath);
                  const label = descriptor?.header ?? field.propertyPath;
                  return (
                    <div
                      key={field.propertyPath}
                      className={cn(
                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                        field.selected && 'bg-accent/50'
                      )}
                    >
                      <Checkbox
                        checked={field.selected}
                        onCheckedChange={() => toggleField(field.propertyPath)}
                        id={`field-${field.propertyPath}`}
                      />
                      <label
                        htmlFor={`field-${field.propertyPath}`}
                        className="flex-1 cursor-pointer select-none"
                      >
                        {label}
                      </label>
                      {descriptor?.isNavigation && (
                        <Badge variant="secondary" className="text-xs">
                          nav
                        </Badge>
                      )}
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={index === 0}
                          onClick={() => moveField(index, 'up')}
                        >
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{t('DataExchange.Export.MoveUp')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={index === selectedFields.length - 1}
                          onClick={() => moveField(index, 'down')}
                        >
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{t('DataExchange.Export.MoveDown')}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Job status */}
            {exportJob.job && (
              <div data-slot="export-status" className="space-y-2">
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  {exportJob.job.status === 'Completed' && (
                    <Check
                      className="h-4 w-4 text-success-600 dark:text-success-500"
                      aria-hidden="true"
                    />
                  )}
                  {exportJob.job.status === 'Failed' && (
                    <X className="h-4 w-4 text-destructive" aria-hidden="true" />
                  )}
                  {exportJob.job.status !== 'Completed' && exportJob.job.status !== 'Failed' && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  <span>{STATUS_LABELS[exportJob.job.status]}</span>
                  {exportJob.job.rowCount != null && (
                    <span className="text-muted-foreground">({exportJob.job.rowCount} rows)</span>
                  )}
                </div>
                {exportJob.job.errorMessage && (
                  <p className="text-sm text-destructive">{exportJob.job.errorMessage}</p>
                )}
              </div>
            )}

            {exportJob.error && !exportJob.job && (
              <p className="text-sm text-destructive">{exportJob.error.message}</p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {/* Save preset */}
          {showSavePreset ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder={t('DataExchange.Export.PresetNamePlaceholder')}
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset();
                  if (e.key === 'Escape') setShowSavePreset(false);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                {t('Common.Save')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSavePreset(false)}>
                {t('Common.Cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePreset(true)}
              disabled={selectedCount === 0}
            >
              <Save className="mr-1 h-3 w-3" aria-hidden="true" />
              {t('DataExchange.Export.SavePreset')}
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              {t('Common.Close')}
            </Button>
            <Button onClick={handleExport} disabled={selectedCount === 0 || isJobActive}>
              {isJobActive ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {t('DataExchange.Export.Label')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
