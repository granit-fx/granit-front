/** Permission constants for the workflow module. Mirrors `Granit.Workflow.Endpoints.Permissions.WorkflowPermissions`. */
export const WorkflowPermissions = {
  /** Permissions for workflow history resource. */
  History: {
    /** Grants read access to the workflow transition history endpoint (ISO 27001 audit trail). */
    Read: 'Workflow.History.Read',
  },
  /** Permissions for workflow transition resource. */
  Transitions: {
    /** Grants read access to query available workflow transitions for a given state. */
    Read: 'Workflow.Transitions.Read',
    /** Grants permission to execute workflow state transitions. */
    Execute: 'Workflow.Transitions.Execute',
  },
} as const;
