import { classifyMergeError } from '@granit/entity-merge';
import { useState } from 'react';

import { useFieldChoices } from '../hooks/use-field-choices.js';
import { useMergeMutation } from '../hooks/use-merge-mutation.js';
import { useMergePreview } from '../hooks/use-merge-preview.js';

import { FieldConflictTable } from './field-conflict-table.js';
import { MergeConfirmDialog } from './merge-confirm-dialog.js';
import { ReferenceRewriterSummary } from './reference-rewriter-summary.js';

import type { FieldConflictTableLabels } from './field-conflict-table.js';
import type { MergeConfirmDialogLabels } from './merge-confirm-dialog.js';
import type { ReferenceRewriterSummaryLabels } from './reference-rewriter-summary.js';
import type { MergeMutationVariables } from '../hooks/use-merge-mutation.js';
import type { MergeErrorKind, MergeResult } from '@granit/entity-merge';
import type { ReactNode } from 'react';

const REASON_MAX_LENGTH = 1000;

/** Full label bag for {@link MergeWizard} and its sub-components. */
export interface MergeWizardLabels {
  readonly title: string;
  readonly subtitle?: string;
  readonly conflictsHeading: string;
  readonly rewritesHeading: string;
  readonly reasonLabel: string;
  readonly reasonHelp?: string;
  readonly reasonPlaceholder?: string;
  readonly cancel: string;
  readonly merge: string;
  readonly conflictTable: FieldConflictTableLabels;
  readonly rewriterSummary: ReferenceRewriterSummaryLabels;
  readonly confirmDialog: MergeConfirmDialogLabels;
  /** Message per {@link MergeErrorKind}; `domain`/`unknown` may be enriched with the server detail. */
  readonly errors: Readonly<Record<MergeErrorKind, string>>;
}

export interface MergeWizardProps<TId extends string = string> {
  readonly survivorId: TId;
  readonly loserId: TId;
  readonly labels: MergeWizardLabels;
  /** Map a raw field path to a human label (default: identity). */
  readonly translateFieldPath?: (fieldPath: string) => string;
  /** Map a rewriter key to a human label (default: identity). */
  readonly translateRewriter?: (key: string) => string;
  /** Render the per-rewriter row count, handling pluralization (default: `String`). */
  readonly translateRows?: (count: number) => string;
  /** Optional survivor summary slot (e.g. an aggregate card). */
  readonly renderSurvivor?: () => ReactNode;
  /** Optional loser summary slot. */
  readonly renderLoser?: () => ReactNode;
  /** Override the default error-message resolution. */
  readonly formatError?: (error: unknown) => string | null;
  readonly onSuccess?: (result: MergeResult<TId>) => void;
  readonly onCancel?: () => void;
  /** Invalidate aggregate-specific queries (list/detail/…) after a committed merge. */
  readonly onInvalidate?: (variables: MergeMutationVariables<TId>) => Promise<void> | void;
}

/**
 * Headless, label-driven merge wizard for two aggregates: dry-run preview →
 * per-field conflict resolution → confirm → commit. Aggregate-agnostic — pass
 * `renderSurvivor`/`renderLoser` to show domain summary cards and a `labels`
 * bag for all copy. Requires an `<EntityMergeProvider>` and a React Query
 * `<QueryClientProvider>` ancestor. Unstyled beyond minimal Tailwind utilities.
 */
export function MergeWizard<TId extends string = string>({
  survivorId,
  loserId,
  labels,
  translateFieldPath,
  translateRewriter,
  translateRows,
  renderSurvivor,
  renderLoser,
  formatError,
  onSuccess,
  onCancel,
  onInvalidate,
}: Readonly<MergeWizardProps<TId>>) {
  const previewQuery = useMergePreview<TId>(survivorId, loserId);
  const mergeMutation = useMergeMutation<TId>(survivorId, { onInvalidate });

  const conflicts = previewQuery.data?.conflicts ?? [];
  const rewriteCounts = previewQuery.data?.rewriteCounts ?? {};
  const { choices, setChoice } = useFieldChoices(conflicts);

  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  const resolveError = formatError ?? ((error: unknown) => defaultFormatError(labels, error));
  const errorMessage = resolveError(mergeMutation.error);

  const submitDisabled = previewQuery.isLoading || previewQuery.isError || mergeMutation.isPending;

  const runMerge = () => {
    mergeMutation.mutate(
      {
        request: {
          loserId,
          choices,
          reason: reason.trim() === '' ? null : reason,
          dryRun: false,
        },
      },
      {
        onSuccess: (result) => {
          setConfirming(false);
          onSuccess?.(result);
        },
      }
    );
  };

  return (
    <div data-slot="merge-wizard" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">{labels.title}</h2>
        {labels.subtitle && <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>}
      </header>

      {(renderSurvivor || renderLoser) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div data-slot="merge-survivor">{renderSurvivor?.()}</div>
          <div data-slot="merge-loser">{renderLoser?.()}</div>
        </div>
      )}

      <section data-slot="merge-conflicts" className="space-y-3">
        <h3 className="text-base font-semibold">{labels.conflictsHeading}</h3>
        <FieldConflictTable
          conflicts={conflicts}
          choices={choices}
          onChoiceChange={setChoice}
          labels={labels.conflictTable}
          translateFieldPath={translateFieldPath}
          isLoading={previewQuery.isLoading}
          isError={previewQuery.isError}
          disabled={mergeMutation.isPending}
        />
      </section>

      <section data-slot="merge-rewrites" className="space-y-2">
        <h3 className="text-base font-semibold">{labels.rewritesHeading}</h3>
        {previewQuery.isLoading ? null : (
          <ReferenceRewriterSummary
            rewriteCounts={rewriteCounts}
            labels={labels.rewriterSummary}
            translateLabel={translateRewriter}
            translateRows={translateRows}
          />
        )}
      </section>

      <div className="space-y-1">
        <label htmlFor="merge-reason" className="text-sm font-medium">
          {labels.reasonLabel}
        </label>
        <textarea
          id="merge-reason"
          name="reason"
          maxLength={REASON_MAX_LENGTH}
          rows={3}
          className="w-full rounded-md border border-input bg-background p-2 text-sm"
          placeholder={labels.reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {labels.reasonHelp && <p className="text-xs text-muted-foreground">{labels.reasonHelp}</p>}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          onClick={onCancel}
          disabled={mergeMutation.isPending}
        >
          {labels.cancel}
        </button>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          onClick={() => setConfirming(true)}
          disabled={submitDisabled}
        >
          {labels.merge}
        </button>
      </div>

      <MergeConfirmDialog
        open={confirming}
        onConfirm={runMerge}
        onCancel={() => setConfirming(false)}
        labels={labels.confirmDialog}
        isPending={mergeMutation.isPending}
      />
    </div>
  );
}

function defaultFormatError(labels: MergeWizardLabels, error: unknown): string | null {
  if (!error) return null;
  const { kind, detail } = classifyMergeError(error);
  if ((kind === 'domain' || kind === 'validation') && detail) {
    return `${labels.errors[kind]} ${detail}`.trim();
  }
  if (kind === 'unknown' && detail) {
    return detail;
  }
  return labels.errors[kind];
}
