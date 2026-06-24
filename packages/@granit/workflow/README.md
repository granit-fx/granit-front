# @granit/workflow

Entity-agnostic **workflow lifecycle** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Workflow` module (contract:
`contracts/openapi/workflow.json`). It models a state machine over any entity:
the current state plus the transitions reachable from it, executing a transition
(with optional approval gating), and reading the ISO 27001 audit trail of past
transitions.

This is the framework-agnostic **core** layer: it exposes the wire types, the
Axios HTTP functions and the permission constants needed to drive a workflow
from any client — React, React Native, a CLI, tests. It holds **no** React, DOM
or Node-only dependency. The React hooks/providers layer lives in
[`@granit/react-workflow`](../react-workflow); the admin UI kit (status bar,
transition dialog, history table, and the self-contained `EntityWorkflow` card)
lives in [`@granit/react-ui-workflow`](../react-ui-workflow).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. A consumer must declare these
peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call, plus `buildApiUrl` for path assembly.
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for the paginated
  history surface.
- `@granit/types` — shared base types (`ISODateString` for audit timestamps).

## Quick start

`basePath` is the workflow collection root (e.g. `/api/v1/workflow`). The
transition calls operate on a bare `currentState` (a stateless state-machine
probe); history is scoped to a concrete `entityType` / `entityId` pair.

```ts
import {
  listTransitions,
  executeStateMachineTransition,
  getHistory,
  TransitionOutcome,
  WorkflowPermissions,
} from '@granit/workflow';

const basePath = '/api/v1/workflow';

// 1. Discover the transitions reachable from a state.
const status = await listTransitions(client, basePath, 'Draft');
// status.currentState === 'Draft'
// status.availableTransitions: { targetState, name, allowed, requiresApproval }[]

// 2. Attempt a transition. The result reports the outcome explicitly —
//    `succeeded` may be false even on a 2xx (e.g. an approval was requested).
const result = await executeStateMachineTransition(client, basePath, 'Draft', {
  targetState: 'Published',
  comment: 'Ready for publication',
});

if (result.outcome === TransitionOutcome.ApprovalRequested) {
  // result.succeeded === false, result.resultingState is unchanged.
}

// 3. Read the entity's audit trail (paginated, newest-first server-side).
const page = await getHistory(client, basePath, 'Document', 'doc-1', { take: 20 });
// page.items: { previousState, newState, transitionedAt, transitionedBy, comment }[]

// 4. Gate UI / fetches on the workflow permissions (see the security caveat).
const canExecute = WorkflowPermissions.Transitions.Execute; // 'Workflow.Transitions.Execute'
```

## Public API

| Symbol                          | Kind  | Purpose                                                                         |
| ------------------------------- | ----- | ------------------------------------------------------------------------------- |
| `WorkflowStatus`                | type  | `{ currentState, availableTransitions }` for a state                            |
| `WorkflowTransition`            | type  | One reachable transition (`targetState`, `name`, `allowed`, `requiresApproval`) |
| `WorkflowTransitionRequest`     | type  | Transition body (`targetState`, optional `comment`)                             |
| `WorkflowTransitionResult`      | type  | Outcome of an attempt (`succeeded`, `resultingState`, `outcome`)                |
| `TransitionHistory`             | type  | One audit-trail entry (states, `transitionedAt/By`, `comment`)                  |
| `WorkflowHistoryPage`           | type  | `PagedResult<TransitionHistory>` — the history response                         |
| `TransitionOutcome`             | const | `Completed \| ApprovalRequested \| Denied \| InvalidTransition`                    |
| `TransitionOutcomeValue`        | type  | Union of `TransitionOutcome` values                                             |
| `WorkflowLifecycleStatus`       | const | Lifecycle enum `Draft \| PendingReview \| Published \| Archived`                   |
| `WorkflowLifecycleStatusValue`  | type  | Union of `WorkflowLifecycleStatus` numeric values                               |
| `listTransitions`               | fn    | `GET {basePath}/transitions?currentState=` → `WorkflowStatus`                   |
| `executeStateMachineTransition` | fn    | `POST {basePath}/transitions?currentState=` → result                            |
| `getHistory`                    | fn    | `GET {basePath}/{entityType}/{entityId}/history` (paginated)                    |
| `WorkflowPermissions`           | const | Backend permission names (`Workflow.History.Read`, `Transitions.Read/Execute`)  |

`entityType` and `entityId` are URL-encoded by `getHistory`; both transition
calls send `currentState` as a query parameter (the state machine is probed
without an entity context).

## Caveats

- **A 2xx is not success.** `executeStateMachineTransition` resolves on any 2xx;
  the authoritative result is `WorkflowTransitionResult.outcome`. Always branch on
  `outcome` / `succeeded`, not on the absence of a thrown error — an
  `ApprovalRequested` or `Denied` transition returns `succeeded: false` with the
  state left unchanged.
- **Permission constants are UX hints, not enforcement.** `WorkflowPermissions`
  mirrors `Granit.Workflow.Endpoints.Permissions.WorkflowPermissions` so the UI
  can hide controls and skip fetches; the .NET backend re-checks every transition
  and history read. See [`@granit/react-authorization`](../react-authorization)
  for the full client-side authorization posture.
- **History is an ISO 27001 / audit trail.** `TransitionHistory` carries
  `transitionedBy` (the acting principal) — treat it as audit-grade data; do not
  log or surface it beyond what the screen requires in multi-tenant contexts.
- **i18n is the caller's job.** `TransitionOutcome` is a stable, locale-free enum;
  the React/UI layer ([`@granit/react-ui-workflow`](../react-ui-workflow)) owns
  the localized message mapping.

## Out of scope

- **React bindings** — provider, query hooks (`useWorkflowStatus`,
  `useWorkflowTransition`, `useWorkflowHistory`) and query-key factories live in
  [`@granit/react-workflow`](../react-workflow); this package is headless.
- **Rendering** — the status bar, transition dialog, history table and the
  self-contained `EntityWorkflow` card live in
  [`@granit/react-ui-workflow`](../react-ui-workflow).
- **State-machine definition** — the set of valid states and transition rules is
  owned by the `Granit.Workflow` backend; this package only consumes whatever the
  endpoints advertise.

## License

Apache-2.0
