/**
 * English admin strings for the Scheduling UI. Flat `Scheduling.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim).
 */
export const schedulingTranslationsEn = {
  'Scheduling.Actions.Cancel': 'Cancel',
  'Scheduling.Actions.CancelConfirm': 'Are you sure you want to cancel this action?',
  'Scheduling.Actions.NewExecuteAt': 'New Execution Date',
  'Scheduling.Actions.Reschedule': 'Reschedule',
  'Scheduling.Actions.RescheduleDescription':
    'Select a new execution date and time for this scheduled action.',
  'Scheduling.Actions.RescheduleTitle': 'Reschedule Action',
  'Scheduling.Columns.CorrelationId': 'Correlation ID',
  'Scheduling.Columns.CreatedAt': 'Created At',
  'Scheduling.Columns.ExecuteAt': 'Execute At',
  'Scheduling.Columns.ExecutedAt': 'Executed At',
  'Scheduling.Columns.PayloadType': 'Payload Type',
  'Scheduling.Columns.Status': 'Status',
  'Scheduling.Detail': 'Scheduled Action',
  'Scheduling.Errors.AlreadyProcessed': 'Action already processed',
  'Scheduling.Fields.CancelledBy': 'Cancelled By',
  'Scheduling.Fields.FailureReason': 'Failure Reason',
  'Scheduling.Fields.Id': 'ID',
  'Scheduling.NotFound': 'Scheduled action not found',
  'Scheduling.Status.Cancelled': 'Cancelled',
  'Scheduling.Status.Executed': 'Executed',
  'Scheduling.Status.Failed': 'Failed',
  'Scheduling.Status.Pending': 'Pending',
  'Scheduling.Status.Processing': 'Processing',
  'Scheduling.Subtitle': 'Manage scheduled actions',
  'Scheduling.Title': 'Scheduled Actions',
} as const;
