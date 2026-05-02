import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { useTranslation } from 'react-i18next';

import { useDismissPartyDuplicateMutation } from '../hooks/use-party-duplicates.js';
import { usePartiesConfig } from '../providers/parties-provider.js';

import type { DuplicateMatchTier, PartyDuplicateCandidateResponse } from '@granit/parties';
import type { ReactNode } from 'react';

const PARTIES_NAMESPACE = 'parties';

/** Internal key prefix that lets the dismiss / merge mutations invalidate the inbox. */
const INBOX_QUERY_KEY_PREFIX = ['parties', 'duplicates', 'inbox'] as const;

export interface DuplicatesInboxProps {
  /**
   * Called when the user clicks "Merge…" on a row. The consumer is expected to
   * open its own merge UI (typically the existing `<MergeWizard>` from #1294
   * wrapped in a Dialog / Drawer with a survivor picker), pre-filled with the
   * row's `partyId` and `candidateId`.
   *
   * The candidate row is exposed as-is so the consumer can extract whichever
   * id pair it needs.
   */
  readonly onMerge?: (candidate: PartyDuplicateCandidateResponse) => void;
  /**
   * Override page size for the underlying QueryEngine call. Defaults to 20.
   */
  readonly pageSize?: number;
  /**
   * Render-prop for linking a Party id to its detail page. When omitted, the
   * Party A / Party B columns render plain text. Useful when the consumer's
   * router exposes a typed `<Link>` component.
   */
  readonly renderPartyLink?: (partyId: string) => ReactNode;
}

/**
 * Paginated review surface for pending duplicate-candidate pairs. Wraps itself
 * in a `<QueryProvider>` so the consumer only needs to provide the parent
 * `<PartiesProvider>` upstream.
 *
 * Permission gating is delegated to the consumer — wrap with your own guard
 * checking `PartiesPermissions.Parties.Read` for the inbox itself,
 * `…Manage` for dismiss, and `…Merge` for the merge shortcut.
 *
 * @example
 * ```tsx
 * <DuplicatesInbox onMerge={(row) => openMergeDialog(row)} />
 * ```
 */
export function DuplicatesInbox(props: Readonly<DuplicatesInboxProps>) {
  const config = usePartiesConfig();
  const basePath = config.basePath!;

  return (
    <QueryProvider
      config={{
        client: config.client,
        basePath: `${basePath}/duplicates`,
        queryKeyPrefix: [...INBOX_QUERY_KEY_PREFIX],
      }}
    >
      <DuplicatesInboxBody {...props} />
    </QueryProvider>
  );
}

function DuplicatesInboxBody({
  onMerge,
  pageSize,
  renderPartyLink,
}: Readonly<DuplicatesInboxProps>) {
  const { t } = useTranslation(PARTIES_NAMESPACE);
  const dismissMutation = useDismissPartyDuplicateMutation();

  const { params, query, setPage } = useQueryEndpoint<PartyDuplicateCandidateResponse>({
    initialParams: { page: 1, pageSize: pageSize ?? 20 },
  });

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const currentPage = params.page ?? 1;
  const currentPageSize = params.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));

  return (
    <div data-slot="duplicates-inbox" className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold">{t('Duplicates.Inbox.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Duplicates.Inbox.Subtitle')}</p>
      </header>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">{t('Duplicates.Columns.Score')}</th>
              <th className="px-3 py-2 font-medium">{t('Duplicates.Columns.Tier')}</th>
              <th className="px-3 py-2 font-medium">{t('Duplicates.Columns.PartyA')}</th>
              <th className="px-3 py-2 font-medium">{t('Duplicates.Columns.PartyB')}</th>
              <th className="px-3 py-2 font-medium">{t('Duplicates.Columns.Detected')}</th>
              <th className="px-3 py-2 font-medium">{t('Duplicates.Columns.Refreshed')}</th>
              <th className="px-3 py-2 font-medium text-right">
                {t('Duplicates.Columns.Actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {renderTableBody({
              isLoading: query.isLoading,
              isError: query.isError,
              items,
              loadingLabel: t('Duplicates.LoadingState'),
              errorLabel: t('Duplicates.ErrorState'),
              emptyLabel: t('Duplicates.EmptyState'),
              renderRow: (row) => (
                <DuplicateRow
                  key={row.id}
                  row={row}
                  onDismiss={() => dismissMutation.mutate({ id: row.id })}
                  onMerge={onMerge ? () => onMerge(row) : undefined}
                  renderPartyLink={renderPartyLink}
                  dismissDisabled={dismissMutation.isPending}
                  dismissLabel={t('Duplicates.Actions.Dismiss')}
                  mergeLabel={t('Duplicates.Actions.Merge')}
                  tierLabels={{
                    Deterministic: t('Duplicates.Tier.Deterministic'),
                    Blocking: t('Duplicates.Tier.Blocking'),
                    Fuzzy: t('Duplicates.Tier.Fuzzy'),
                  }}
                />
              ),
            })}
          </tbody>
        </table>
      </div>

      {totalCount > currentPageSize && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('Duplicates.Pagination.PageOfTotal', { page: currentPage, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-input bg-background px-3 py-1 text-sm font-medium disabled:opacity-50"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              {t('Duplicates.Pagination.Previous')}
            </button>
            <button
              type="button"
              className="rounded-md border border-input bg-background px-3 py-1 text-sm font-medium disabled:opacity-50"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              {t('Duplicates.Pagination.Next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DuplicateRowProps {
  readonly row: PartyDuplicateCandidateResponse;
  readonly onDismiss: () => void;
  readonly onMerge?: () => void;
  readonly renderPartyLink?: (partyId: string) => ReactNode;
  readonly dismissDisabled: boolean;
  readonly dismissLabel: string;
  readonly mergeLabel: string;
  readonly tierLabels: Record<DuplicateMatchTier, string>;
}

const TIER_TONES: Record<DuplicateMatchTier, string> = {
  Deterministic: 'bg-green-100 text-green-800 border-green-300',
  Blocking: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Fuzzy: 'bg-blue-100 text-blue-800 border-blue-300',
};

function DuplicateRow({
  row,
  onDismiss,
  onMerge,
  renderPartyLink,
  dismissDisabled,
  dismissLabel,
  mergeLabel,
  tierLabels,
}: Readonly<DuplicateRowProps>) {
  return (
    <tr data-slot="duplicate-row" data-row-id={row.id} className="border-b last:border-b-0">
      <td className="px-3 py-2 font-mono">{row.score.toFixed(2)}</td>
      <td className="px-3 py-2">
        <span
          data-slot="tier-badge"
          data-tier={row.tier}
          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_TONES[row.tier]}`}
        >
          {tierLabels[row.tier]}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-xs">
        {renderPartyLink ? renderPartyLink(row.partyId) : row.partyId}
      </td>
      <td className="px-3 py-2 font-mono text-xs">
        {renderPartyLink ? renderPartyLink(row.candidateId) : row.candidateId}
      </td>
      <td className="px-3 py-2 text-muted-foreground">{formatDate(row.createdAt)}</td>
      <td className="px-3 py-2 text-muted-foreground">{formatDate(row.updatedAt)}</td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={dismissDisabled}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {dismissLabel}
          </button>
          {onMerge && (
            <button
              type="button"
              onClick={onMerge}
              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
            >
              {mergeLabel}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  // Plain ISO display — consumers are expected to inject locale-aware
  // formatting via their own theming layer if needed. The framework package
  // intentionally avoids pulling in date-fns / Intl here.
  return value.slice(0, 10);
}

interface RenderTableBodyArgs {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly items: readonly PartyDuplicateCandidateResponse[];
  readonly loadingLabel: string;
  readonly errorLabel: string;
  readonly emptyLabel: string;
  readonly renderRow: (row: PartyDuplicateCandidateResponse) => ReactNode;
}

function renderTableBody({
  isLoading,
  isError,
  items,
  loadingLabel,
  errorLabel,
  emptyLabel,
  renderRow,
}: RenderTableBodyArgs): ReactNode {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
          {loadingLabel}
        </td>
      </tr>
    );
  }
  if (isError) {
    return (
      <tr>
        <td colSpan={7} className="px-3 py-8 text-center text-destructive">
          <span role="alert">{errorLabel}</span>
        </td>
      </tr>
    );
  }
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
          {emptyLabel}
        </td>
      </tr>
    );
  }
  return items.map(renderRow);
}
