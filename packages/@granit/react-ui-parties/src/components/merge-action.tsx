import { useTranslation } from '@granit/react-localization';
import { MergeWizard } from '@granit/react-parties';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@granit/react-ui';
import { GitMerge } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PartyPickerDialog } from './party-picker-dialog';

import type { PartyId, PartyListItemResponse } from '@granit/parties';

interface MergeActionProps {
  readonly survivorId: PartyId;
  readonly survivorName: string;
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'picker' }
  | { kind: 'wizard'; loser: PartyListItemResponse };

export function MergeAction({ survivorId, survivorName }: MergeActionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });

  const handleSuccess = () => {
    toast.success(t('Parties.Merge.Success', { name: survivorName }));
    setStage({ kind: 'idle' });
    navigate(`/parties/${survivorId}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setStage({ kind: 'picker' })}
        data-slot="merge-action-trigger"
      >
        <GitMerge className="mr-1 h-4 w-4" />
        {t('Parties.Merge.Action')}
      </Button>

      <PartyPickerDialog
        open={stage.kind === 'picker'}
        onOpenChange={(open) => {
          if (!open) setStage({ kind: 'idle' });
        }}
        excludeId={survivorId}
        onSelect={(loser) => setStage({ kind: 'wizard', loser })}
      />

      <Dialog
        open={stage.kind === 'wizard'}
        onOpenChange={(open) => {
          if (!open) setStage({ kind: 'idle' });
        }}
      >
        <DialogContent data-slot="merge-wizard-dialog" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('Parties.Merge.WizardTitle', { name: survivorName })}</DialogTitle>
            <DialogDescription>{t('Parties.Merge.WizardDescription')}</DialogDescription>
          </DialogHeader>
          {stage.kind === 'wizard' && (
            <MergeWizard
              survivorId={survivorId}
              loserId={stage.loser.id}
              onCancel={() => setStage({ kind: 'idle' })}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
