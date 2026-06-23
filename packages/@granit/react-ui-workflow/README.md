# @granit/react-ui-workflow

Workflow UI for Granit admin apps — pairs with the headless
[`@granit/react-workflow`](../react-workflow) (the transition/history hooks and
`WorkflowProvider`).

The headless package owns the _data_ (`useTransitions`, `useExecuteTransition`,
`useWorkflowHistory`); this package owns the _UI_.

## Components

- **`WorkflowStatusBar`** — the state chips + available-transition buttons.
- **`TransitionCommentDialog`** — optional-comment dialog shown before a
  transition (handles the approval-required variant).
- **`WorkflowHistory`** — the transition audit-trail table.
- **`EntityWorkflow`** — a self-contained card combining the three above; it
  mounts `WorkflowProvider` internally, so a consumer only supplies the API
  `config` plus the entity coordinates.

`EntityWorkflow` is app-agnostic: it takes the workflow API `config`
(`{ client, basePath }`) as a prop — the host passes its own `workflowConfig` —
so the package never reaches into app config. The `Workflow.*` /
`Components.Workflow.*` strings ship in `workflowTranslationsEn` /
`workflowTranslationsFr`; register them in your i18n instance.

## Usage

```tsx
import { EntityWorkflow } from '@granit/react-ui-workflow';
import { workflowConfig } from '@/app/shared/app-config';

<EntityWorkflow
  config={workflowConfig}
  entityType="Invoice"
  entityId={invoice.id}
  currentState={invoice.status}
  states={INVOICE_WORKFLOW_STATES}
/>;
```
