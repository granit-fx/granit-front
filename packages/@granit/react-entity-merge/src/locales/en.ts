import type { MergeWizardLabels } from '../components/merge-wizard.js';

/**
 * Default English label bag for the generic {@link MergeWizard}. Convenience
 * for consumers without their own i18n — domain packages typically build their
 * own labels from translation keys instead.
 */
export const entityMergeTranslationsEn: MergeWizardLabels = {
  title: 'Merge records',
  subtitle: 'Resolve conflicts and review what will be rewritten before committing.',
  conflictsHeading: 'Field conflicts',
  rewritesHeading: 'What will be rewritten',
  reasonLabel: 'Reason',
  reasonHelp: 'Optional admin justification — captured in the audit log.',
  reasonPlaceholder: 'e.g. Duplicate created by an integration.',
  cancel: 'Cancel',
  merge: 'Merge',
  conflictTable: {
    survivor: 'Survivor',
    loser: 'Loser',
    empty: 'No field-level conflicts — all values match or only one side is set.',
    loading: 'Computing preview…',
    error: 'Could not compute the merge preview.',
    valueEmpty: '(empty)',
  },
  rewriterSummary: {
    empty: 'No cross-module references to rewrite.',
  },
  confirmDialog: {
    title: 'Confirm merge',
    body: 'This merge is irreversible — the loser is soft-archived (tombstoned) and its references are reattached to the survivor.',
    confirm: 'Merge',
    cancel: 'Cancel',
  },
  errors: {
    conflict:
      'This pair is already merged or another administrator just completed the operation. Refresh and try again.',
    domain: 'The merge cannot proceed:',
    notFound: 'The survivor or loser no longer exists.',
    validation: 'The request is invalid:',
    unknown: 'An unexpected error occurred.',
  },
};
