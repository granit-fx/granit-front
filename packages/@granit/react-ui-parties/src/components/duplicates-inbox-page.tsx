import { DuplicatesInbox } from '@granit/react-parties';
import { useState } from 'react';

import { MergeFromCandidate } from './merge-from-candidate';

import type { PartyDuplicateCandidateResponse } from '@granit/parties';

export function DuplicatesInboxPage() {
  const [candidate, setCandidate] = useState<PartyDuplicateCandidateResponse | null>(null);

  return (
    <div data-slot="duplicates-inbox-page" className="space-y-6">
      <DuplicatesInbox onMerge={(row) => setCandidate(row)} />

      <MergeFromCandidate candidate={candidate} onClose={() => setCandidate(null)} />
    </div>
  );
}
