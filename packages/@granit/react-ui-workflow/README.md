# @granit/react-ui-workflow

Admin **workflow UI kit** for Granit apps — the Odoo-style status bar, the
transition-comment dialog, the audit-trail history table, and the self-contained
`EntityWorkflow` card that wires them together. This is the **react-ui admin
feature kit** layer: it renders; it does not own data fetching.

The split is three packages over the same .NET `Granit.Workflow` backend
(contract: `contracts/openapi/workflow.json` — paginated transition history,
available-transition listing, and transition execution):

- [`@granit/workflow`](../workflow) — framework-agnostic core: DTOs
  (`WorkflowTransition`, `TransitionHistory`, `WorkflowTransitionResult`, …) +
  Axios functions (`listTransitions`, `getHistory`,
  `executeStateMachineTransition`) and `WorkflowPermissions`.
- [`@granit/react-workflow`](../react-workflow) — React Query hooks + provider:
  `WorkflowProvider`, `useTransitions`, `useExecuteTransition`,
  `useWorkflowHistory` and the `WorkflowConfig` (`{ client, basePath }`) shape.
- `@granit/react-ui-workflow` (this package) — the rendering layer.

`EntityWorkflow` is the only piece that touches data: it mounts a
`WorkflowProvider` internally and drives the headless hooks, so a host supplies
only the workflow API `config` plus the entity coordinates. The three primitives
(`WorkflowStatusBar`, `TransitionCommentDialog`, `WorkflowHistory`) are pure,
data-prop components you can compose by hand if the card is not what you need.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-workflow` — the headless hooks + `WorkflowProvider` that
  `EntityWorkflow` orchestrates and the source of the `WorkflowConfig` prop type.
- `@granit/workflow` — core DTOs (`WorkflowTransition`, `TransitionHistory`,
  `WorkflowTransitionResult`) consumed by the component props.
- `@granit/react-ui` — the shadcn/ui primitives (`Card`, `Dialog`, `Table`,
  `Badge`, `Button`, `Textarea`, `Spinner`, `toast`) the components render with.
- `@granit/react-localization` — `useTranslation`; the `Workflow.*` /
  `Components.Workflow.*` strings are resolved through it.
- `@granit/utils` — the `cn` class-merge helper.
- `lucide-react` (`^1.21`) — the `GitBranch` / `AlertCircle` card icons.
- `react` and `react-dom` (`^19`).

## Quick start

`EntityWorkflow` is the batteries-included path — pass the host's
`WorkflowConfig` and the entity coordinates, and register the translation
bundles once in your i18n instance.

```tsx
import { EntityWorkflow, workflowAdminTranslationsEn } from '@granit/react-ui-workflow';
import { workflowConfig } from '@/app/shared/app-config';
import i18n from '@/app/i18n';

// The dotted keys (`Workflow.Title`, `Components.Workflow.Actions`, …) are
// looked up verbatim — register the bundle with key/ns separators disabled.
i18n.addResourceBundle('en', 'translation', workflowAdminTranslationsEn, true, true);

function InvoiceWorkflowCard({ invoice }: { invoice: Invoice }) {
  return (
    <EntityWorkflow
      config={workflowConfig}            // { client, basePath } — WorkflowConfig
      entityType="Acme.Invoices"         // fully qualified entity type
      entityId={invoice.id}
      currentState={invoice.status}
      states={INVOICE_WORKFLOW_STATES}   // ordered states, for the status bar
      onStateChange={(next) => refetchInvoice()}
    />
  );
}
```

Need a custom layout instead of the card? Compose the three primitives directly
against the headless hooks from [`@granit/react-workflow`](../react-workflow):

```tsx
import {
  WorkflowStatusBar,
  TransitionCommentDialog,
  WorkflowHistory,
} from '@granit/react-ui-workflow';
import { useTransitions, useExecuteTransition, useWorkflowHistory } from '@granit/react-workflow';

function CustomWorkflow({ entityType, entityId, currentState, states }: Props) {
  const { data } = useTransitions({ currentState });
  const { data: history, isLoading } = useWorkflowHistory({ entityType, entityId });
  const { transition } = useExecuteTransition();

  return (
    <>
      <WorkflowStatusBar
        currentState={currentState}
        states={states}
        transitions={data?.availableTransitions ?? []}
        onTransition={(target) => transition(currentState, target)}
      />
      <WorkflowHistory history={history?.items ?? []} loading={isLoading} />
    </>
  );
}
```

## Public API

| Symbol                         | Kind      | Purpose                                                           |
| ------------------------------ | --------- | ----------------------------------------------------------------- |
| `EntityWorkflow`               | component | Self-contained card; mounts `WorkflowProvider` + the 3 primitives |
| `EntityWorkflowProps`          | type      | `config` + `entityType`/`entityId`/`currentState`/`states` props  |
| `WorkflowStatusBar`            | component | Odoo-style state chips + available-transition action buttons      |
| `WorkflowStatusBarProps`       | type      | `currentState`, `states`, `transitions`, `onTransition` props     |
| `TransitionCommentDialog`      | component | Pre-transition dialog with an optional comment (max 2000 chars)   |
| `TransitionCommentDialogProps` | type      | `open`, `transitionName`, `requiresApproval`, callbacks           |
| `WorkflowHistory`              | component | Audit-trail table: prev/new state, author, timestamp, comment     |
| `WorkflowHistoryProps`         | type      | `history`, `loading`, `emptyMessage`, `className`                 |
| `workflowAdminTranslationsEn`  | const     | English `Workflow.*` / `Components.Workflow.*` string bundle      |
| `workflowAdminTranslationsFr`  | const     | French `Workflow.*` / `Components.Workflow.*` string bundle       |

`EntityWorkflow` reports each transition's outcome via `toast`
(`Completed` / `ApprovalRequested` / `Denied` / `InvalidTransition`) and calls
`onStateChange` with the resulting state only on a `Completed` outcome.

## Out of scope / caveats

- **Verbatim dotted i18n keys.** The bundles use flat keys like
  `Workflow.Title` and `Components.Workflow.Actions` in the `translation`
  namespace; register them with `keySeparator: false` and `nsSeparator: false`
  (or `addResourceBundle(..., deep, overwrite)`) so i18next looks them up as-is
  rather than treating the dots as nesting. Note the export names are
  `workflowAdminTranslationsEn` / `workflowAdminTranslationsFr` — distinct from
  the headless package's `workflowTranslationsEn` / `workflowTranslationsFr`
  (lifecycle-prompt strings), which serve a different surface.
- **No data layer.** Fetching, mutation, query keys, and the `WorkflowProvider`
  live in [`@granit/react-workflow`](../react-workflow); DTOs and the Axios
  client live in [`@granit/workflow`](../workflow). The three primitives here
  are pure data-prop components — only `EntityWorkflow` invokes the hooks, and it
  does so through its own internally-mounted provider.
- **Permission checks are a UX hint, not a boundary.** The status bar hides or
  re-labels transitions (`requiresApproval` / `allowed`), but the .NET
  `Granit.Workflow` backend is authoritative: a `Denied` outcome is the server
  rejecting a transition the caller was allowed to *attempt*. Never treat a
  rendered (or hidden) action button as enforcement.
- **App-agnostic by construction.** `EntityWorkflow` takes the API `config` as a
  prop and ships its own translations, so it never reaches into app config and
  carries no domain-specific (FHIR / admin-role / HDS) assumptions. `entityType`
  is a fully qualified string (e.g. `Acme.Invoices`) and `states` is the host's
  ordered display list — neither is derived from the backend.

## License

Apache-2.0
