import type { MergeResult } from '@granit/entity-merge';

/** Default base path used by {@link createEntityMergeHandlers} when none is given. */
export const MOCK_BASE_PATH = '/api/v1/mergeables';

/** A realistic merge preview fixture: two conflicts, two non-zero rewrite counts. */
export const mockMergeResult: MergeResult = {
  survivorId: '00000000-0000-0000-0000-000000000001',
  loserId: '00000000-0000-0000-0000-000000000002',
  conflicts: [
    { fieldPath: 'Name', survivorValue: 'Acme S', loserValue: 'Acme L', default: 'Survivor' },
    { fieldPath: 'TaxStatus', survivorValue: 'Standard', loserValue: 'Exempt', default: 'Loser' },
  ],
  rewriteCounts: { 'Invoice.PartyId': 17, 'Subscription.PartyId': 3, 'Payment.PartyId': 0 },
  dryRun: true,
};

/** An empty merge result — no conflicts, nothing to rewrite. */
export const mockEmptyMergeResult: MergeResult = {
  survivorId: '00000000-0000-0000-0000-000000000001',
  loserId: '00000000-0000-0000-0000-000000000002',
  conflicts: [],
  rewriteCounts: {},
  dryRun: true,
};
