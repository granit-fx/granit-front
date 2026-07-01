import { ReferenceRewriterSummary, useFieldChoices } from '@granit/react-entity-merge';
import {
  isAxiosError,
  useMergePartyMutation,
  useMergePartyPreviewQuery,
  usePartyQuery,
} from '@granit/react-parties';
import { Button, Card, CardContent, CardHeader, Label, Textarea } from '@granit/react-ui';
import { FieldConflictTable } from '@granit/react-ui-entity-merge';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PartyId, PartyResponse } from '@granit/parties';

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
 * Side-by-side merge wizard for two parties. Composes the aggregate-agnostic
 * building blocks from `@granit/react-entity-merge` (`FieldConflictTable`,
 * `ReferenceRewriterSummary`, `useFieldChoices`) and the shared `@granit/react-ui`
 * primitives (`Card`, `Textarea`, `Button`), adding the party-specific summary
 * cards, i18n and error copy.
 *
 * Permission gating is delegated to the consumer — wrap the wizard with your own
 * guard checking `PartiesPermissions.Parties.Merge`.
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

  const { choices, setChoice } = useFieldChoices(conflicts);
  const [reason, setReason] = useState('');

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
        <FieldConflictTable
          conflicts={conflicts}
          choices={choices}
          onChoiceChange={setChoice}
          isLoading={previewLoading}
          isError={previewQuery.isError}
          disabled={mergeMutation.isPending}
          translateFieldPath={(fieldPath) =>
            t(`MergeWizard.Fields.${fieldPath}`, { defaultValue: fieldPath })
          }
          labels={{
            survivor: t('MergeWizard.Survivor'),
            loser: t('MergeWizard.Loser'),
            empty: t('MergeWizard.ConflictsEmpty'),
            loading: t('MergeWizard.Loading'),
            error: t('MergeWizard.Errors.PreviewFailed'),
            valueEmpty: t('MergeWizard.ValueEmpty'),
          }}
        />
      </section>

      {/* Rewrite counts */}
      <section data-slot="merge-rewrites" className="space-y-2">
        <h3 className="text-base font-semibold">{t('MergeWizard.Rewrites')}</h3>
        {previewLoading ? null : (
          <ReferenceRewriterSummary
            rewriteCounts={rewriteCounts}
            labels={{ empty: t('MergeWizard.RewritesEmpty') }}
            translateLabel={(key) => t(`MergeWizard.Rewriters.${key}`, { defaultValue: key })}
            translateRows={(count) => t('MergeWizard.RewritesRowCount', { count })}
          />
        )}
      </section>

      {/* Reason */}
      <div className="space-y-1">
        <Label htmlFor="merge-reason">{t('MergeWizard.Reason')}</Label>
        <Textarea
          id="merge-reason"
          name="reason"
          maxLength={REASON_MAX_LENGTH}
          rows={3}
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mergeMutation.isPending}
        >
          {t('MergeWizard.Cancel')}
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {t('MergeWizard.Merge')}
        </Button>
      </div>
    </form>
  );
}

// ── Party-specific sub-components ────────────────────────────────────────────

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
    <Card data-slot="party-card" data-variant={variant}>
      <CardHeader className="flex flex-row items-baseline justify-between gap-2 space-y-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {party && (
          <span data-slot="party-status" className="text-xs">
            {party.status}
          </span>
        )}
      </CardHeader>
      <CardContent>
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
                  value={`${defaultBilling.street1}, ${defaultBilling.postalCode} ${defaultBilling.city} (${defaultBilling.country})`}
                />
              )}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
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

// ── Error formatting ───────────────────────────────────────────────────────

type Translator = ReturnType<typeof useTranslation>['t'];

function formatError(t: Translator, error: unknown): string | null {
  if (!error) return null;
  if (!isAxiosError(error)) return t('MergeWizard.Errors.Unknown');

  const data = error.response?.data as { detail?: string; title?: string } | undefined;
  const status = error.response?.status;
  const detail = data?.detail ?? data?.title;

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
