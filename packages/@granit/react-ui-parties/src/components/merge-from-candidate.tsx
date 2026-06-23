import { useTranslation } from '@granit/react-localization';
import { MergeWizard } from '@granit/react-parties';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  toast,
} from '@granit/react-ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { PartyDuplicateCandidateResponse, PartyId } from '@granit/parties';

type Side = 'partyA' | 'partyB';

interface MergeFromCandidateProps {
  /** Candidate row picked from the inbox; null while idle. */
  readonly candidate: PartyDuplicateCandidateResponse | null;
  readonly onClose: () => void;
}

/**
 * Two-step merge flow when the trigger comes from the duplicates inbox row:
 * the row gives us a `(partyId, candidateId)` pair but no opinion on which
 * one wins, so we ask the admin first, then hand off to the existing
 * `<MergeWizard>` with the chosen survivor / loser.
 */
export function MergeFromCandidate({ candidate, onClose }: MergeFromCandidateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [survivor, setSurvivor] = useState<Side>('partyA');
  const [confirmed, setConfirmed] = useState<{
    survivorId: PartyId;
    loserId: PartyId;
  } | null>(null);

  const open = candidate !== null;

  const handleConfirm = () => {
    if (!candidate) return;
    const survivorId = survivor === 'partyA' ? candidate.partyId : candidate.candidateId;
    const loserId = survivor === 'partyA' ? candidate.candidateId : candidate.partyId;
    setConfirmed({ survivorId, loserId });
  };

  const handleClose = () => {
    setConfirmed(null);
    setSurvivor('partyA');
    onClose();
  };

  const handleSuccess = ({ survivorId }: { survivorId: PartyId }) => {
    toast.success(t('Parties.Merge.SuccessGeneric'));
    handleClose();
    navigate(`/parties/${survivorId}`);
  };

  if (confirmed && candidate) {
    return (
      <Dialog open onOpenChange={(o) => !o && handleClose()}>
        <DialogContent data-slot="merge-from-candidate-wizard" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Parties.Duplicates.MergeWizardTitle')}</DialogTitle>
            <DialogDescription>{t('Parties.Duplicates.MergeWizardDescription')}</DialogDescription>
          </DialogHeader>
          <MergeWizard
            survivorId={confirmed.survivorId}
            loserId={confirmed.loserId}
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent data-slot="merge-from-candidate-survivor-picker">
        <DialogHeader>
          <DialogTitle>{t('Parties.Duplicates.PickSurvivorTitle')}</DialogTitle>
          <DialogDescription>{t('Parties.Duplicates.PickSurvivorHelp')}</DialogDescription>
        </DialogHeader>
        {candidate && (
          <div className="space-y-4">
            <RadioGroup value={survivor} onValueChange={(v) => setSurvivor(v as Side)}>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <RadioGroupItem value="partyA" id="merge-survivor-a" className="mt-1" />
                <Label htmlFor="merge-survivor-a" className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t('Parties.Duplicates.PartyA')}</span>
                  <span className="break-all font-mono text-xs text-muted-foreground">
                    {candidate.partyId}
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <RadioGroupItem value="partyB" id="merge-survivor-b" className="mt-1" />
                <Label htmlFor="merge-survivor-b" className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t('Parties.Duplicates.PartyB')}</span>
                  <span className="break-all font-mono text-xs text-muted-foreground">
                    {candidate.candidateId}
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('Common.Cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!candidate}>
            {t('Common.Next')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
