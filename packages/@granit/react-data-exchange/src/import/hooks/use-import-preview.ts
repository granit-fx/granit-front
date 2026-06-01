import { dryRunImport, previewImport } from '@granit/data-exchange';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useImportConfig } from '../providers/import-provider';

import type {
  ImportColumnMapping,
  ImportFieldMetadata,
  ImportReportResponse,
} from '@granit/data-exchange';

export interface UseImportPreviewReturn {
  /** Trigger preview extraction for a job. */
  readonly preview: (jobId: string) => void;
  /** Current headers from the file. */
  readonly headers: readonly string[];
  /** Preview rows from the file. */
  readonly previewRows: readonly (readonly string[])[];
  /** Suggested column mappings. */
  readonly suggestions: readonly ImportColumnMapping[];
  /** Available target fields metadata. */
  readonly fieldMetadata: readonly ImportFieldMetadata[];
  /** Editable mappings (initialized from suggestions). */
  readonly mappings: ImportColumnMapping[];
  /** Update a single mapping. */
  readonly updateMapping: (sourceColumn: string, targetProperty: string | null) => void;
  /** Run a dry-run validation. */
  readonly dryRun: (jobId: string) => void;
  /** Dry-run report result. */
  readonly dryRunReport: ImportReportResponse | null;
  /** Whether preview is loading. */
  readonly isPreviewing: boolean;
  /** Whether dry-run is loading. */
  readonly isDryRunning: boolean;
  /** Error from preview or dry-run. */
  readonly error: Error | null;
  /** Reset state. */
  readonly reset: () => void;
}

/**
 * Hook for managing import preview, mapping editing, and dry-run validation.
 */
export function useImportPreview(): UseImportPreviewReturn {
  const config = useImportConfig();

  const [headers, setHeaders] = useState<readonly string[]>([]);
  const [previewRows, setPreviewRows] = useState<readonly (readonly string[])[]>([]);
  const [suggestions, setSuggestions] = useState<readonly ImportColumnMapping[]>([]);
  const [fieldMetadata, setFieldMetadata] = useState<readonly ImportFieldMetadata[]>([]);
  const [mappings, setMappings] = useState<ImportColumnMapping[]>([]);

  const previewMutation = useMutation({
    mutationFn: (jobId: string) => previewImport(config.client, config.basePath, jobId),
    onSuccess: (data) => {
      setHeaders(data.headers);
      setPreviewRows(data.previewRows);
      setSuggestions(data.suggestions);
      setFieldMetadata(data.fieldMetadata);
      setMappings(data.suggestions.map((s) => ({ ...s })));
    },
  });

  const dryRunMutation = useMutation({
    mutationFn: (jobId: string) => dryRunImport(config.client, config.basePath, jobId),
  });

  const updateMapping = useCallback((sourceColumn: string, targetProperty: string | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetProperty, confidence: 'Manual' as const }
          : m
      )
    );
  }, []);

  const preview = useCallback(
    (jobId: string) => {
      previewMutation.mutate(jobId);
    },
    [previewMutation]
  );

  const dryRun = useCallback(
    (jobId: string) => {
      dryRunMutation.mutate(jobId);
    },
    [dryRunMutation]
  );

  const reset = useCallback(() => {
    setHeaders([]);
    setPreviewRows([]);
    setSuggestions([]);
    setFieldMetadata([]);
    setMappings([]);
    previewMutation.reset();
    dryRunMutation.reset();
  }, [dryRunMutation, previewMutation]);

  return {
    preview,
    headers,
    previewRows,
    suggestions,
    fieldMetadata,
    mappings,
    updateMapping,
    dryRun,
    dryRunReport: dryRunMutation.data ?? null,
    isPreviewing: previewMutation.isPending,
    isDryRunning: dryRunMutation.isPending,
    error: previewMutation.error ?? dryRunMutation.error ?? null,
    reset,
  };
}
