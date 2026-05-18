import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePartyQuery } from '../hooks/use-parties.js';
import { useMergePartyMutation, useMergePartyPreviewQuery } from '../hooks/use-party-merge.js';

import type { AxiosError } from '@granit/api-client';
import type { FieldConflictResponse, MergeWinner, PartyId, PartyResponse } from '@granit/parties';

const REASON_MAX_LENGTH = 1000;
const PARTIES_NAMESPACE = 'parties';

export interface MergeWizardProps {
  /** Party that will absorb the other (kept). */
  readonly survivorId: PartyId;
  /** Party that will be tombstoned. */
  readonly loserId: PartyId;
  /** Called when the live merge succeeds (after cache invalidation). */
  readonly onSuccess?: (result: {
    readonly survivorId: PartyId;
    readonly loserId: PartyId;
  }) => void;
  /** Called when the user clicks Cancel. The component does not own its open state. */
  readonly onCancel?: () => void;
}

/**
 * Side-by-side merge wizard for two parties. The component is unstyled beyond
 * minimal Tailwind utility classes so consumers can wrap it in their own modal
 * / dialog / drawer and theme it with the rest of the admin UI.
 *
 * Permission gating is delegated to the consumer — wrap the wizard with your
 * own permission guard checking `PartiesPermissions.Parties.Merge`.
 *
 * @example
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <MergeWizard
 *     survivorId={survivorId}
 *     loserId={loserId}
 *     onCancel={() => setOpen(false)}
 *     onSuccess={() => { setOpen(false); navigate(`/parties/${survivorId}`); }}
 *   />
 * </Dialog>
 * ```
 */
export function MergeWizard({
  survivorId,
  loserId,
  onCancel,
  onSuccess,
}: Readonly<MergeWizardProps>) {
  const { t } = useTranslation(PARTIES_NAMESPACE);

  const survivorQuery = usePartyQuery(survivorId);
  const loserQuery = usePartyQuery(loserId);
  const previewQuery = useMergePartyPreviewQuery({ survivorId, loserId });
  const mergeMutation = useMergePartyMutation(survivorId);

  const conflicts = previewQuery.data?.conflicts ?? [];
  const rewriteCounts = previewQuery.data?.rewriteCounts ?? {};

  const [choices, setChoices] = useState<Record<string, MergeWinner>>({});
  const [reason, setReason] = useState('');

  // Seed `choices` with the recommended defaults the first time the preview lands
  // (or whenever survivor/loser change). Manual edits made afterwards are kept.
  useEffect(() => {
    if (conflicts.length === 0) return;
    setChoices((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const c of conflicts) {
        if (!(c.fieldPath in next)) {
          next[c.fieldPath] = c.default;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [conflicts]);

  const handleChoiceChange = (fieldPath: string, winner: MergeWinner) => {
    setChoices((prev) => ({ ...prev, [fieldPath]: winner }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        onSuccess: () => {
          onSuccess?.({ survivorId, loserId });
        },
      }
    );
  };

  const errorMessage = useMemo(() => formatError(t, mergeMutation.error), [t, mergeMutation.error]);

  const previewLoading = previewQuery.isLoading;
  const submitDisabled = previewLoading || mergeMutation.isPending || previewQuery.isError;

  return (
    <form data-slot="merge-wizard" className="space-y-6" onSubmit={handleSubmit}>
      <header>
        <h2 className="text-2xl font-semibold">{t('MergeWizard.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('MergeWizard.Subtitle')}</p>
      </header>

      {/* Side-by-side party cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PartyCard
          variant="survivor"
          party={survivorQuery.data}
          loading={survivorQuery.isLoading}
          title={t('MergeWizard.Survivor')}
          help={t('MergeWizard.SurvivorHelp')}
        />
        <PartyCard
          variant="loser"
          party={loserQuery.data}
          loading={loserQuery.isLoading}
          title={t('MergeWizard.Loser')}
          help={t('MergeWizard.LoserHelp')}
        />
      </div>

      {/* Conflicts */}
      <section data-slot="merge-conflicts" className="space-y-3">
        <h3 className="text-base font-semibold">{t('MergeWizard.Conflicts')}</h3>
        <ConflictsBody
          isLoading={previewLoading}
          isError={previewQuery.isError}
          conflicts={conflicts}
          choices={choices}
          onChange={handleChoiceChange}
          loadingLabel={t('MergeWizard.Loading')}
          errorLabel={t('MergeWizard.Errors.PreviewFailed')}
          emptyLabel={t('MergeWizard.ConflictsEmpty')}
          survivorLabel={t('MergeWizard.Survivor')}
          loserLabel={t('MergeWizard.Loser')}
          valueEmptyLabel={t('MergeWizard.ValueEmpty')}
          translateField={(fieldPath) =>
            t(`MergeWizard.Fields.${fieldPath}`, { defaultValue: fieldPath })
          }
        />
      </section>

      {/* Rewrite counts */}
      <section data-slot="merge-rewrites" className="space-y-2">
        <h3 className="text-base font-semibold">{t('MergeWizard.Rewrites')}</h3>
        {previewLoading ? null : (
          <RewriteCountsList
            counts={rewriteCounts}
            translateLabel={(key) => t(`MergeWizard.Rewriters.${key}`, { defaultValue: key })}
            translateRows={(count) => t('MergeWizard.RewritesRowCount', { count })}
            emptyLabel={t('MergeWizard.RewritesEmpty')}
          />
        )}
      </section>

      {/* Reason */}
      <div className="space-y-1">
        <label htmlFor="merge-reason" className="text-sm font-medium">
          {t('MergeWizard.Reason')}
        </label>
        <textarea
          id="merge-reason"
          name="reason"
          maxLength={REASON_MAX_LENGTH}
          rows={3}
          className="w-full rounded-md border border-input bg-background p-2 text-sm"
          placeholder={t('MergeWizard.ReasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t('MergeWizard.ReasonHelp')}</p>
      </div>

      {/* Error banner (post-submit) */}
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          onClick={onCancel}
          disabled={mergeMutation.isPending}
        >
          {t('MergeWizard.Cancel')}
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={submitDisabled}
        >
          {t('MergeWizard.Merge')}
        </button>
      </div>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface ConflictsBodyProps {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly conflicts: readonly FieldConflictResponse[];
  readonly choices: Readonly<Record<string, MergeWinner>>;
  readonly onChange: (fieldPath: string, winner: MergeWinner) => void;
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly emptyLabel: string;
  readonly survivorLabel: string;
  readonly loserLabel: string;
  readonly valueEmptyLabel: string;
  readonly translateField: (fieldPath: string) => string;
}

function ConflictsBody({
  isLoading,
  isError,
  conflicts,
  choices,
  onChange,
  loadingLabel,
  errorLabel,
  emptyLabel,
  survivorLabel,
  loserLabel,
  valueEmptyLabel,
  translateField,
}: Readonly<ConflictsBodyProps>) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{loadingLabel}</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {errorLabel}
      </p>
    );
  }
  if (conflicts.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {conflicts.map((conflict) => (
        <ConflictRow
          key={conflict.fieldPath}
          conflict={conflict}
          selected={choices[conflict.fieldPath] ?? conflict.default}
          onChange={onChange}
          survivorLabel={survivorLabel}
          loserLabel={loserLabel}
          emptyLabel={valueEmptyLabel}
          fieldLabel={translateField(conflict.fieldPath)}
        />
      ))}
    </ul>
  );
}

interface PartyCardProps {
  readonly variant: 'survivor' | 'loser';
  readonly party: PartyResponse | undefined;
  readonly loading: boolean;
  readonly title: string;
  readonly help: string;
}

function PartyCard({ variant, party, loading, title, help }: Readonly<PartyCardProps>) {
  const primaryEmail = party?.emails.find((e) => e.isPrimary)?.address ?? null;
  const primaryPhone = party?.phones.find((p) => p.isPrimary)?.number ?? null;
  const defaultBilling =
    party?.addresses.find((a) => a.kind === 'Billing' && a.isDefault) ??
    party?.addresses.find((a) => a.isDefault);

  return (
    <article
      data-slot="party-card"
      data-variant={variant}
      className="rounded-md border bg-card p-4 text-card-foreground"
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {party && (
          <span data-slot="party-status" className="text-xs">
            {party.status}
          </span>
        )}
      </header>
      {loading || !party ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : (
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{party.name}</p>
          <p className="text-xs text-muted-foreground">{help}</p>
          <dl className="mt-2 space-y-0.5 text-xs">
            <KeyValue label="Roles" value={party.roles} />
            <KeyValue label="Email" value={primaryEmail} />
            <KeyValue label="Phone" value={primaryPhone} />
            {defaultBilling && (
              <KeyValue
                label="Address"
                value={`${defaultBilling.line1}, ${defaultBilling.postalCode} ${defaultBilling.city} (${defaultBilling.country})`}
              />
            )}
          </dl>
        </div>
      )}
    </article>
  );
}

function KeyValue({ label, value }: Readonly<{ label: string; value: string | null }>) {
  if (!value) return null;
  return (
    <div className="flex gap-1">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}

interface ConflictRowProps {
  readonly conflict: FieldConflictResponse;
  readonly selected: MergeWinner;
  readonly onChange: (fieldPath: string, winner: MergeWinner) => void;
  readonly survivorLabel: string;
  readonly loserLabel: string;
  readonly emptyLabel: string;
  readonly fieldLabel: string;
}

function ConflictRow({
  conflict,
  selected,
  onChange,
  survivorLabel,
  loserLabel,
  emptyLabel,
  fieldLabel,
}: Readonly<ConflictRowProps>) {
  const groupName = `merge-choice-${conflict.fieldPath}`;
  return (
    <li
      data-slot="conflict-row"
      data-field-path={conflict.fieldPath}
      className="rounded-md border p-3"
    >
      <div className="mb-2 text-sm font-medium">{fieldLabel}</div>
      <div role="radiogroup" aria-label={fieldLabel} className="grid gap-2 md:grid-cols-2">
        <ChoiceRadio
          name={groupName}
          value="Survivor"
          checked={selected === 'Survivor'}
          onChange={() => onChange(conflict.fieldPath, 'Survivor')}
          label={survivorLabel}
          displayValue={conflict.survivorValue ?? emptyLabel}
        />
        <ChoiceRadio
          name={groupName}
          value="Loser"
          checked={selected === 'Loser'}
          onChange={() => onChange(conflict.fieldPath, 'Loser')}
          label={loserLabel}
          displayValue={conflict.loserValue ?? emptyLabel}
        />
      </div>
    </li>
  );
}

interface ChoiceRadioProps {
  readonly name: string;
  readonly value: MergeWinner;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly label: string;
  readonly displayValue: string;
}

function ChoiceRadio({
  name,
  value,
  checked,
  onChange,
  label,
  displayValue,
}: Readonly<ChoiceRadioProps>) {
  return (
    <label
      data-slot="choice-radio"
      data-checked={checked || undefined}
      aria-label={`${label}: ${displayValue}`}
      className="flex cursor-pointer items-start gap-2 rounded-md border bg-background p-2 text-sm has-checked:border-primary"
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />
      <span className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="break-all">{displayValue}</span>
      </span>
    </label>
  );
}

interface RewriteCountsListProps {
  readonly counts: Readonly<Record<string, number>>;
  readonly translateLabel: (key: string) => string;
  readonly translateRows: (count: number) => string;
  readonly emptyLabel: string;
}

function RewriteCountsList({
  counts,
  translateLabel,
  translateRows,
  emptyLabel,
}: Readonly<RewriteCountsListProps>) {
  const visible = Object.entries(counts).filter(([, n]) => n > 0);
  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul data-slot="rewrite-counts" className="space-y-1 text-sm">
      {visible.map(([key, n]) => (
        <li key={key} className="flex justify-between gap-2">
          <span>{translateLabel(key)}</span>
          <span className="font-mono">{translateRows(n)}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Error formatting ───────────────────────────────────────────────────────

type Translator = ReturnType<typeof useTranslation>['t'];

function formatError(t: Translator, error: unknown): string | null {
  if (!error) return null;
  const axiosError = error as AxiosError<{ detail?: string; title?: string }>;
  const status = axiosError.response?.status;
  const detail = axiosError.response?.data?.detail ?? axiosError.response?.data?.title;

  if (status === 409) {
    return t('MergeWizard.Errors.AlreadyMerged');
  }
  if (status === 422 && detail) {
    return t('MergeWizard.Errors.DomainConflict', { message: detail });
  }
  if (detail) {
    return detail;
  }
  return t('MergeWizard.Errors.Unknown');
}
