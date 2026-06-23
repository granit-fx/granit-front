/**
 * English strings for the Timeline UI. Flat `Timeline.*` keys in the
 * `translation` namespace (the host registers them with separators disabled,
 * so the dotted keys are looked up verbatim). Named with the `timelineAdmin`
 * prefix to avoid colliding with the headless `@granit/react-timeline`
 * `timelineTranslations*` exports.
 */
export const timelineAdminTranslationsEn = {
  'Timeline.AddComment': 'Add a comment...',
  'Timeline.AddDialogDescription': 'Write a comment or internal note.',
  'Timeline.AddDialogTitle': 'Add timeline entry',
  'Timeline.AddEntry': 'Add entry',
  'Timeline.AddReaction': 'Add reaction',
  'Timeline.CancelReply': 'Cancel',
  'Timeline.Empty': 'No timeline entries yet.',
  'Timeline.ErrorMessage': 'Could not load timeline entries.',
  'Timeline.ErrorTitle': 'Failed to load timeline',
  'Timeline.ReplyDialogTitle': 'Reply to entry',
  'Timeline.ReplyingTo': 'Replying to a comment',
  'Timeline.Send': 'Send',
  'Timeline.Title': 'Timeline',
} as const;
