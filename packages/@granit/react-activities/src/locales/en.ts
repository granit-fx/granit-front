/**
 * English translation bundle for `@granit/react-activities`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('en', 'activities', activitiesTranslationsEn);
 *
 * Components in this package don't call `useTranslation` directly — they
 * expose `labels` / `actionLabels` props that apps populate from `t()`.
 * This keeps the components testable without i18next bootstrap.
 */
export const activitiesTranslationsEn: ActivitiesTranslations = {
  Action: {
    Complete: 'Complete',
    Cancel: 'Cancel',
    Reassign: 'Reassign',
    Reschedule: 'Reschedule',
    Create: '+ Activity',
  },
  Status: {
    Open: 'Open',
    Done: 'Done',
    Cancelled: 'Cancelled',
    Overdue: 'Overdue',
  },
  StatusFilter: {
    All: 'All',
    OpenOrOverdue: 'Open or overdue',
  },
  List: {
    Loading: 'Loading…',
    Error: 'Failed to load activities.',
    Empty: 'No activities.',
    Header: {
      Type: 'Type',
      Entity: 'Entity',
      Assignee: 'Assignee',
      Due: 'Due',
      Status: 'Status',
      Actions: 'Actions',
    },
    Pagination: {
      Previous: 'Previous page',
      Next: 'Next page',
      Page: 'Page {{page}} / {{total}}',
    },
  },
  Detail: {
    Loading: 'Loading…',
    Error: 'Failed to load activity.',
    Field: {
      Type: 'Type',
      Entity: 'Entity',
      Assignee: 'Assignee',
      Due: 'Due',
      Status: 'Status',
      Description: 'Description',
      Completed: 'Completed',
      Created: 'Created',
    },
  },
  Calendar: {
    Loading: 'Loading…',
    Error: 'Failed to load calendar.',
    Empty: 'No activities in this window.',
    Nav: {
      Previous: 'Previous',
      Next: 'Next',
      Today: 'Today',
    },
    View: {
      Day: 'Day',
      Week: 'Week',
      Month: 'Month',
      Label: 'View',
    },
  },
  SidePanel: {
    Title: 'Activities',
  },
  Notification: {
    Type: {
      Assigned: 'Activity assigned',
      Reminder: 'Activity reminder',
      Overdue: 'Activity overdue',
    },
  },
};

export interface ActivitiesTranslations {
  readonly Action: {
    readonly Complete: string;
    readonly Cancel: string;
    readonly Reassign: string;
    readonly Reschedule: string;
    readonly Create: string;
  };
  readonly Status: {
    readonly Open: string;
    readonly Done: string;
    readonly Cancelled: string;
    readonly Overdue: string;
  };
  readonly StatusFilter: {
    readonly All: string;
    readonly OpenOrOverdue: string;
  };
  readonly List: {
    readonly Loading: string;
    readonly Error: string;
    readonly Empty: string;
    readonly Header: {
      readonly Type: string;
      readonly Entity: string;
      readonly Assignee: string;
      readonly Due: string;
      readonly Status: string;
      readonly Actions: string;
    };
    readonly Pagination: {
      readonly Previous: string;
      readonly Next: string;
      readonly Page: string;
    };
  };
  readonly Detail: {
    readonly Loading: string;
    readonly Error: string;
    readonly Field: {
      readonly Type: string;
      readonly Entity: string;
      readonly Assignee: string;
      readonly Due: string;
      readonly Status: string;
      readonly Description: string;
      readonly Completed: string;
      readonly Created: string;
    };
  };
  readonly Calendar: {
    readonly Loading: string;
    readonly Error: string;
    readonly Empty: string;
    readonly Nav: {
      readonly Previous: string;
      readonly Next: string;
      readonly Today: string;
    };
    readonly View: {
      readonly Day: string;
      readonly Week: string;
      readonly Month: string;
      readonly Label: string;
    };
  };
  readonly SidePanel: {
    readonly Title: string;
  };
  readonly Notification: {
    readonly Type: {
      readonly Assigned: string;
      readonly Reminder: string;
      readonly Overdue: string;
    };
  };
}
