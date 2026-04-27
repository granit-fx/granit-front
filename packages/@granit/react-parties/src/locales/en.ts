/**
 * English translation bundle for the parties feature. Consumers register it
 * via `i18n.addResourceBundle('en', 'parties', partiesTranslationsEn)` (or
 * via the `react-i18next` configuration).
 */
export const partiesTranslationsEn = {
  MergeWizard: {
    Title: 'Merge parties',
    Subtitle: 'Resolve conflicts and review what will be rewritten before committing.',
    Survivor: 'Survivor',
    Loser: 'Loser',
    SurvivorHelp: 'The party that will absorb the other.',
    LoserHelp: 'The party that will be tombstoned.',
    Conflicts: 'Field conflicts',
    ConflictsEmpty: 'No field-level conflicts — all values match or only one side is set.',
    Rewrites: 'What will be rewritten',
    RewritesEmpty: 'No cross-module references to rewrite.',
    RewritesRowCount_one: '{{count}} row',
    RewritesRowCount_other: '{{count}} rows',
    Reason: 'Reason',
    ReasonHelp: 'Optional admin justification — captured in the audit log.',
    ReasonPlaceholder: 'e.g. Duplicate created by ERP sync.',
    Cancel: 'Cancel',
    Merge: 'Merge',
    Loading: 'Computing preview…',
    Errors: {
      PreviewFailed: 'Could not compute the merge preview.',
      MergeFailed: 'Merge failed.',
      DomainConflict: 'The merge cannot proceed: {{message}}',
      AlreadyMerged:
        'This pair is already merged or another administrator just completed the operation. Refresh and try again.',
      Unknown: 'An unexpected error occurred.',
    },
    Fields: {
      Name: 'Name',
      Website: 'Website',
      Language: 'Language',
      Timezone: 'Timezone',
      TaxId: 'Tax id',
      RegistrationNumber: 'Registration number',
      TaxStatus: 'Tax status',
      InternalNotes: 'Internal notes',
    },
    Rewriters: {
      'Invoice.PartyId': 'Invoices',
      'Subscription.PartyId': 'Subscriptions',
      'BalanceAccount.PartyId': 'Balance accounts',
      'Payment.PartyId': 'Payments',
      'Party.ParentContactId': 'Child parties (parent reattached)',
      'Party.Children': 'Children of the loser (reattached to survivor)',
    },
    ValueEmpty: '(empty)',
  },
  Duplicates: {
    Inbox: {
      Title: 'Potential duplicates',
      Subtitle:
        'Review pairs flagged by the recurring scan. Dismiss false positives or merge confirmed duplicates.',
    },
    Columns: {
      Score: 'Score',
      Tier: 'Tier',
      PartyA: 'Party A',
      PartyB: 'Party B',
      Detected: 'Detected',
      Refreshed: 'Refreshed',
      Actions: 'Actions',
    },
    Tier: {
      Deterministic: 'Deterministic',
      Blocking: 'Blocking',
      Fuzzy: 'Fuzzy',
    },
    Actions: {
      Dismiss: 'Dismiss',
      Merge: 'Merge…',
      DismissedToast: 'Pair dismissed.',
      MergedToast: 'Parties merged.',
    },
    EmptyState: 'No pending duplicates.',
    LoadingState: 'Loading duplicates…',
    ErrorState: 'Could not load duplicates.',
    Pagination: {
      Previous: 'Previous',
      Next: 'Next',
      PageOfTotal: 'Page {{page}} of {{total}}',
    },
    Badge: {
      PerParty_one: 'Potential duplicate ({{count}})',
      PerParty_other: 'Potential duplicates ({{count}})',
    },
  },
} as const;
