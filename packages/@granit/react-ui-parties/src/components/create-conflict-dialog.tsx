import { useTranslation } from '@granit/react-localization';
import { usePartyQuery } from '@granit/react-parties';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  toast,
} from '@granit/react-ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { logger } from '../logger';

import { MergeWizard } from './merge-wizard';
import { PartyStatusBadge } from './party-status-badge';

import type {
  PartyCreateConflictResponse,
  PartyCreateDuplicateCandidate,
  PartyId,
} from '@granit/parties';

interface CreateConflictDialogProps {
  /** Conflict body returned by the 409. Null while idle. */
  readonly conflict: PartyCreateConflictResponse | null;
  /** Re-submit the original create with `options.force = true`. */
  readonly onCreateAnyway: () => Promise<PartyId | null>;
  /** Close the dialog (also discards any pending merge target). */
  readonly onClose: () => void;
}

type Phase = { kind: 'choose' } | { kind: 'merging'; existingId: PartyId; newId: PartyId };

interface CandidateRowProps {
  readonly candidate: PartyCreateDuplicateCandidate;
  readonly busy: boolean;
  readonly onUseExisting: (id: PartyId) => void;
  readonly onMergeInto: (id: PartyId) => void;
}

function CandidateRow({ candidate, busy, onUseExisting, onMergeInto }: CandidateRowProps) {
  const { t } = useTranslation();
  const { data: party, isLoading } = usePartyQuery(candidate.candidateId);

  return (
    <li
      data-slot="conflict-candidate"
      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-0.5">
        {isLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{party?.name ?? candidate.candidateId}</span>
            {party && <PartyStatusBadge status={party.status} />}
            {party && (
              <Badge variant="secondary" className="text-xs">
                {t(`Parties.Kind.${party.kind}`)}
              </Badge>
            )}
          </div>
        )}
        {party?.emails.find((e) => e.isPrimary)?.address && (
          <span className="text-xs text-muted-foreground">
            {party.emails.find((e) => e.isPrimary)!.address}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onUseExisting(candidate.candidateId)}
          disabled={busy || isLoading}
        >
          {t('Parties.CreateConflict.UseExisting')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onMergeInto(candidate.candidateId)}
          disabled={busy || isLoading}
        >
          {t('Parties.CreateConflict.MergeIntoExisting')}
        </Button>
      </div>
    </li>
  );
}

/**
 * Three-action dialog rendered after `POST /parties` returns 409 with a
 * Tier-1 (Deterministic) duplicate match:
 *
 * - **Use existing** — abandon the create and navigate to the matched party.
 * - **Create anyway** — re-submit with `options.force = true` and navigate to
 *   the freshly created party on success.
 * - **Merge into existing** — force-create the new party, then immediately
 *   open the `<MergeWizard>` with the existing party as survivor and the
 *   just-created one as loser, so the new fields the operator typed get
 *   absorbed and the new tombstone is collapsed in one flow.
 */
export function CreateConflictDialog({
  conflict,
  onCreateAnyway,
  onClose,
}: CreateConflictDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>({ kind: 'choose' });
  const [busy, setBusy] = useState(false);

  const open = conflict !== null;

  const reset = () => {
    setPhase({ kind: 'choose' });
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUseExisting = (existingId: PartyId) => {
    handleClose();
    navigate(`/parties/${existingId}`);
  };

  const handleCreateAnyway = async () => {
    setBusy(true);
    try {
      const newId = await onCreateAnyway();
      if (newId) {
        toast.success(t('Parties.CreateConflict.CreateAnywaySuccess'));
        handleClose();
        navigate(`/parties/${newId}`);
      } else {
        setBusy(false);
      }
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[CreateConflictDialog] create anyway failed', err);
      setBusy(false);
    }
  };

  const handleMergeInto = async (existingId: PartyId) => {
    setBusy(true);
    try {
      const newId = await onCreateAnyway();
      if (newId) {
        setPhase({ kind: 'merging', existingId, newId });
      } else {
        setBusy(false);
      }
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[CreateConflictDialog] merge-into force-create failed', err);
      setBusy(false);
    }
  };

  const handleMergeSuccess = ({ survivorId }: { survivorId: PartyId }) => {
    toast.success(t('Parties.Merge.SuccessGeneric'));
    handleClose();
    navigate(`/parties/${survivorId}`);
  };

  if (phase.kind === 'merging') {
    return (
      <Dialog open onOpenChange={(o) => !o && handleClose()}>
        <DialogContent data-slot="create-conflict-merge" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Parties.Duplicates.MergeWizardTitle')}</DialogTitle>
          </DialogHeader>
          <MergeWizard
            survivorId={phase.existingId}
            loserId={phase.newId}
            onCancel={handleClose}
            onSuccess={handleMergeSuccess}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent data-slot="create-conflict-dialog" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Parties.CreateConflict.Title')}</DialogTitle>
          {conflict && (
            <DialogDescription>
              {t('Parties.CreateConflict.Description', { count: conflict.candidates.length })}
            </DialogDescription>
          )}
        </DialogHeader>

        {conflict && (
          <ul className="space-y-2">
            {conflict.candidates.map((candidate) => (
              <CandidateRow
                key={candidate.candidateId}
                candidate={candidate}
                busy={busy}
                onUseExisting={handleUseExisting}
                onMergeInto={handleMergeInto}
              />
            ))}
          </ul>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={handleClose} disabled={busy}>
            {t('Common.Cancel')}
          </Button>
          <Button type="button" onClick={handleCreateAnyway} disabled={busy}>
            {busy ? t('Common.Loading') : t('Parties.CreateConflict.CreateAnyway')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
