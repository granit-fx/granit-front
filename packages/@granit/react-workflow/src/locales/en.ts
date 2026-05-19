// ---------------------------------------------------------------------------
// @granit/react-workflow — English i18n bundle (namespace: "workflow")
// ---------------------------------------------------------------------------
//
// Register at app bootstrap:
//   import { workflowTranslationsEn } from '@granit/react-workflow';
//   i18n.addResourceBundle('en', 'workflow', workflowTranslationsEn);
//
// Apps can override any key in their own bundle (i18next merges deeply)
// to customize wording per domain — e.g. "Publish product" instead of
// the generic "Publish".

/** Strings for a single lifecycle transition prompt. */
export interface WorkflowTransitionStrings {
  readonly Title: string;
  readonly Description: string;
  readonly Confirm: string;
}

/** Shape of the resource bundle registered under the `workflow` namespace. */
export interface WorkflowTranslations {
  readonly Transition: {
    readonly DraftToPublished: WorkflowTransitionStrings;
    readonly DraftToPendingReview: WorkflowTransitionStrings;
    readonly PendingReviewToPublished: WorkflowTransitionStrings;
    readonly PendingReviewToDraft: WorkflowTransitionStrings;
    readonly PublishedToArchived: WorkflowTransitionStrings;
    readonly ArchivedToPublished: WorkflowTransitionStrings;
    readonly UnknownToUnknown: WorkflowTransitionStrings;
  };
}

export const workflowTranslationsEn: WorkflowTranslations = {
  Transition: {
    DraftToPublished: {
      Title: 'Publish this item?',
      Description:
        'Publishing makes the item available to other modules (Subscriptions, Metering, …). You can archive it later, but you cannot return it to Draft once published.',
      Confirm: 'Publish',
    },
    DraftToPendingReview: {
      Title: 'Submit for review?',
      Description: 'The item moves to "Pending review" and waits for an approver.',
      Confirm: 'Submit',
    },
    PendingReviewToPublished: {
      Title: 'Approve and publish?',
      Description: 'Approves the item and publishes it. This cannot be reverted to Draft.',
      Confirm: 'Approve & publish',
    },
    PendingReviewToDraft: {
      Title: 'Send back to Draft?',
      Description: 'Returns the item to Draft for further edits before another review.',
      Confirm: 'Send back',
    },
    PublishedToArchived: {
      Title: 'Archive this item?',
      Description:
        'Archiving removes the item from active use. Downstream references (subscriptions, line items, …) keep working, but the item can no longer be selected for new operations. This action is final — you will not be able to restore it.',
      Confirm: 'Archive',
    },
    ArchivedToPublished: {
      Title: 'Restore this item?',
      Description: 'Restores the item to Published status so it can be selected again.',
      Confirm: 'Restore',
    },
    UnknownToUnknown: {
      Title: 'Confirm this transition?',
      Description: 'Apply this lifecycle change?',
      Confirm: 'Confirm',
    },
  },
};
