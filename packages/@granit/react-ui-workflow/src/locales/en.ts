/**
 * English strings for the workflow UI. Flat `Workflow.*` / `Components.Workflow.*`
 * keys in the `translation` namespace (the host registers them with separators
 * disabled, so the dotted keys are looked up verbatim).
 */
export const workflowTranslationsEn = {
  'Components.Workflow.Actions': 'Workflow actions',
  'Components.Workflow.RequestApproval': 'Request approval',
  'Workflow.ApprovalDialogDescription':
    'This transition requires approval. Add a comment for the reviewer.',
  'Workflow.ApprovalDialogTitle': 'Request approval',
  'Workflow.Cancel': 'Cancel',
  'Workflow.CommentPlaceholder': 'Comment (optional)...',
  'Workflow.Confirm': 'Confirm',
  'Workflow.ErrorMessage': 'Could not load workflow status.',
  'Workflow.ErrorTitle': 'Failed to load workflow',
  'Workflow.HistoryEmpty': 'No transitions recorded yet.',
  'Workflow.HistoryTitle': 'Transition History',
  'Workflow.OutcomeApprovalRequested': 'Approval request sent.',
  'Workflow.OutcomeCompleted': 'Transition completed successfully.',
  'Workflow.OutcomeDenied': 'Insufficient permission for this transition.',
  'Workflow.OutcomeInvalidTransition': 'This transition is not possible in the current state.',
  'Workflow.RequestApproval': 'Request approval',
  'Workflow.Title': 'Workflow',
  'Workflow.TransitionDialogDescription': 'You can add an optional comment before confirming.',
  'Workflow.TransitionDialogTitle': 'Confirm transition: {{name}}',
} as const;
