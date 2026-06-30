import { useDismissPartyDuplicateMutation, usePartiesConfig } from '@granit/react-parties';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { Badge, Button } from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { DuplicateMatchTier, PartyDuplicateCandidateResponse } from '@granit/parties';
import type { ColumnDef } from '@tanstack/react-table';

const PARTIES_NAMESPACE = 'parties';

/** Internal key prefix that lets the dismiss / merge mutations invalidate the inbox. */
const INBOX_QUERY_KEY_PREFIX = ['parties', 'duplicates', 'inbox'] as const;

const TIER_VARIANTS: Record<DuplicateMatchTier, 'default' | 'secondary' | 'outline'> = {
  Deterministic: 'default',
  Blocking: 'secondary',
  Fuzzy: 'outline',
};

export interface DuplicatesInboxProps {
  /**
   * Called when the user clicks "Merge…" on a row. The consumer is expected to
   * open its own merge UI (typically the `<MergeWizard>` wrapped in a Dialog /
   * Drawer with a survivor picker), pre-filled with the row's `partyId` and
   * `candidateId`.
   */
  readonly onMerge?: (candidate: PartyDuplicateCandidateResponse) => void;
  /** Override page size for the underlying QueryEngine call. Defaults to 20. */
  readonly pageSize?: number;
  /**
   * When provided, the Party A / Party B columns link to the party detail page
   * at this base path (`${partyDetailBasePath}/${partyId}`). Otherwise they
   * render the id as plain text.
   */
  readonly partyDetailBasePath?: string;
}

/**
 * Paginated review surface for pending duplicate-candidate pairs. Composes the
 * shared `QueryEndpointDataTable` (server-driven pagination via `useQueryEndpoint`
 * on `/parties/duplicates`) with `@granit/react-ui` `Badge` / `Button` chrome.
 * Wraps itself in a `<QueryProvider>` so the consumer only needs the parent
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
  partyDetailBasePath,
}: Readonly<DuplicatesInboxProps>) {
  const { t } = useTranslation(PARTIES_NAMESPACE);
  const dismissMutation = useDismissPartyDuplicateMutation();

  const queryEndpoint = useQueryEndpoint<PartyDuplicateCandidateResponse>({
    initialParams: { page: 1, pageSize: pageSize ?? 20 },
  });

  const columns = useMemo<ColumnDef<PartyDuplicateCandidateResponse, unknown>[]>(
    () => [
      {
        id: 'score',
        header: t('Duplicates.Columns.Score'),
        cell: ({ row }) => <span className="font-mono">{row.original.score.toFixed(2)}</span>,
      },
      {
        id: 'tier',
        header: t('Duplicates.Columns.Tier'),
        cell: ({ row }) => (
          <Badge
            data-slot="tier-badge"
            data-tier={row.original.tier}
            variant={TIER_VARIANTS[row.original.tier]}
          >
            {t(`Duplicates.Tier.${row.original.tier}`)}
          </Badge>
        ),
      },
      {
        id: 'partyA',
        header: t('Duplicates.Columns.PartyA'),
        cell: ({ row }) => <PartyRef id={row.original.partyId} basePath={partyDetailBasePath} />,
      },
      {
        id: 'partyB',
        header: t('Duplicates.Columns.PartyB'),
        cell: ({ row }) => (
          <PartyRef id={row.original.candidateId} basePath={partyDetailBasePath} />
        ),
      },
      {
        id: 'detected',
        header: t('Duplicates.Columns.Detected'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'refreshed',
        header: t('Duplicates.Columns.Refreshed'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: t('Duplicates.Columns.Actions'),
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => dismissMutation.mutate({ id: row.original.id })}
              disabled={dismissMutation.isPending}
            >
              {t('Duplicates.Actions.Dismiss')}
            </Button>
            {onMerge && (
              <Button type="button" size="sm" onClick={() => onMerge(row.original)}>
                {t('Duplicates.Actions.Merge')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [t, partyDetailBasePath, dismissMutation, onMerge]
  );

  return (
    <div data-slot="duplicates-inbox" className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold">{t('Duplicates.Inbox.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Duplicates.Inbox.Subtitle')}</p>
      </header>

      {queryEndpoint.query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('Duplicates.ErrorState')}
        </p>
      ) : (
        <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />
      )}
    </div>
  );
}

interface PartyRefProps {
  readonly id: string;
  readonly basePath?: string;
}

function PartyRef({ id, basePath }: Readonly<PartyRefProps>) {
  const content = <span className="font-mono text-xs">{id}</span>;
  return basePath ? (
    <Link data-slot="party-ref" to={`${basePath}/${id}`}>
      {content}
    </Link>
  ) : (
    content
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return value.slice(0, 10);
}
