import { useState } from 'react';

import { DuplicatesInbox } from './duplicates-inbox';
import { MergeFromCandidate } from './merge-from-candidate';

import type { PartyDuplicateCandidateResponse } from '@granit/parties';

export function DuplicatesInboxPage() {
  const [candidate, setCandidate] = useState<PartyDuplicateCandidateResponse | null>(null);

  return (
    <div data-slot="duplicates-inbox-page" className="space-y-6">
      <DuplicatesInbox onMerge={(row) => setCandidate(row)} partyDetailBasePath="/parties" />

      <MergeFromCandidate candidate={candidate} onClose={() => setCandidate(null)} />
    </div>
  );
}
