# @granit/react-workflow

React hooks + provider for the Granit **workflow** module — list available
transitions for a state, execute a state-machine transition, and read an
entity's immutable transition history. This is the **React hooks layer**: it
wraps the framework-agnostic Axios calls and DTOs from
[`@granit/workflow`](../workflow) in TanStack Query hooks behind a shared
`WorkflowProvider` for client / base-path / query-key configuration. It holds no
rendering — status bars, comment dialogs, and history tables live one layer up.

The split is three packages over the same .NET `Granit.Workflow` backend
(contract: `contracts/openapi/workflow.json` — available-transition listing,
transition execution, and paginated transition history):

- [`@granit/workflow`](../workflow) — framework-agnostic core: DTOs
  (`WorkflowTransition`, `TransitionHistory`, `WorkflowTransitionResult`, …) +
  Axios functions (`listTransitions`, `getHistory`,
  `executeStateMachineTransition`), the `WorkflowLifecycleStatus` enum, and
  `WorkflowPermissions`.
- `@granit/react-workflow` (this package) — React Query hooks + provider, plus
  the headless lifecycle-prompt metadata (`buildLifecycleTransitionPrompt`) and
  the `workflow` i18n bundles.
- [`@granit/react-ui-workflow`](../react-ui-workflow) — admin UI kit: the
  Odoo-style status bar, transition-comment dialog, audit-trail history table,
  and the `EntityWorkflow` card that wires them together.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/workflow` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/query-engine` — `PaginationParams` for the history surface.
- `@granit/logger` — `createLogger` for the transition-failure log line.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-workflow/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import {
  WorkflowProvider,
  useTransitions,
  useExecuteTransition,
} from '@granit/react-workflow';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <WorkflowProvider config={{ client: useGranitClient() }}>
      {children}
    </WorkflowProvider>
  );
}

function StatusBar({ currentState }: { currentState: string }) {
  const { data: status } = useTransitions({ currentState });
  const { transition, isPending } = useExecuteTransition();

  return (
    <div>
      <span>State: {status?.currentState}</span>
      {status?.availableTransitions.map((t) => (
        <button
          key={t.name}
          type="button"
          disabled={!t.allowed || isPending}
          // `transition` resolves to the WorkflowTransitionResult, or `null`
          // on error (the hook swallows the throw and logs it); a successful
          // call invalidates the workflow query key so the bar refetches.
          onClick={() => void transition(currentState, t.targetState)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
```

The history hook reads the immutable audit trail; it caches with
`staleTime: Infinity` because an entity's past transitions never change:

```tsx
import { useWorkflowHistory } from '@granit/react-workflow';

function AuditTrail({ entityId }: { entityId: string }) {
  const { data } = useWorkflowHistory({ entityType: 'Party', entityId });
  return (
    <ol>
      {data?.items.map((h, i) => (
        <li key={i}>
          {h.previousState} → {h.newState} · {h.transitionedBy}
        </li>
      ))}
    </ol>
  );
}
```

For lifecycle (`Draft → Published → Archived`) transitions, derive the
confirmation copy and severity from `buildLifecycleTransitionPrompt` and resolve
the keys against the registered `workflow` i18n bundle:

```tsx
import { WorkflowLifecycleStatus } from '@granit/workflow';
import { buildLifecycleTransitionPrompt } from '@granit/react-workflow';
import { useTranslation } from '@granit/react-localization';

function ArchiveConfirm() {
  const { t } = useTranslation('workflow');
  const prompt = buildLifecycleTransitionPrompt(
    WorkflowLifecycleStatus.Published,
    WorkflowLifecycleStatus.Archived
  );
  // prompt.severity === 'destructive', prompt.requiresStrongConfirm === true
  return <AlertDialogTitle>{t(prompt.titleKey)}</AlertDialogTitle>;
}
```

Register the i18n bundles once at bootstrap:

```ts
import { workflowTranslationsEn, workflowTranslationsFr } from '@granit/react-workflow';

i18n.addResourceBundle('en', 'workflow', workflowTranslationsEn);
i18n.addResourceBundle('fr', 'workflow', workflowTranslationsFr);
```

## Public API

| Symbol                           | Kind     | Purpose                                                          |
| -------------------------------- | -------- | ---------------------------------------------------------------- |
| `WorkflowProvider`               | provider | Supplies client, base path, query-key prefix to hooks below      |
| `useWorkflowConfig`              | hook     | Read the resolved config; throws outside a provider              |
| `useTransitions`                 | hook     | `GET .../transitions?currentState=` — state + available moves    |
| `useExecuteTransition`           | hook     | `POST .../transitions` mutation; result or `null`, invalidates   |
| `useWorkflowHistory`             | hook     | `GET .../{type}/{id}/history` — paginated trail, cached forever  |
| `buildWorkflowQueryKey`          | fn       | Query-key factory honoring the configured `queryKeyPrefix`       |
| `buildLifecycleTransitionPrompt` | fn       | `(from, to)` → dialog i18n keys + severity + confirm flag        |
| `workflowTranslationsEn`         | const    | English `workflow` i18next resource bundle                       |
| `workflowTranslationsFr`         | const    | French `workflow` i18next resource bundle                        |
| `WorkflowConfig`                 | type     | Provider input (optional client / basePath / queryKeyPrefix)     |
| `ResolvedWorkflowConfig`         | type     | Provider output with the resolved required client + basePath     |
| `WorkflowProviderProps`          | type     | `{ config, children }`                                           |
| `UseExecuteTransitionOptions`    | type     | `{ onSuccess, onError }` callbacks for the mutation              |
| `UseExecuteTransitionReturn`     | type     | `{ transition, isPending, data, error }` shape                   |
| `UseTransitionsOptions`          | type     | `{ currentState, enabled }`                                      |
| `UseWorkflowHistoryOptions`      | type     | `{ entityType, entityId, page, pageSize, enabled }`              |
| `LifecycleTransitionPrompt`      | type     | Confirm keys + severity + `requiresStrongConfirm`                |
| `LifecycleTransitionSeverity`    | type     | `'info' \| 'warning' \| 'destructive'`                           |
| `WorkflowTranslations`           | type     | Shape of the `workflow` namespace resource bundle                |

`./testing` subpath (requires the optional `msw` peer): `createWorkflowHandlers`
(stateful MSW handlers, default base `/api/v1/workflow`) plus the
`mockWorkflowStatus`, `mockWorkflowHistory`, and `USER_WORKFLOW_STATES` fixtures.

## Out of scope / caveats

- **Rendering** — status bars, comment dialogs, and history tables live in
  [`@granit/react-ui-workflow`](../react-ui-workflow). This package is headless;
  `buildLifecycleTransitionPrompt` returns metadata and i18n *keys* only, so it
  carries no concrete UI-library dependency.
- **DTOs and HTTP transport** — owned by [`@granit/workflow`](../workflow) (mirror
  of `Granit.Workflow`); hooks here only adapt them to React Query.
- **`useExecuteTransition().transition` never throws** — it logs the error via
  `@granit/logger` and resolves to `null`, so call sites must null-check the
  result (or read `error` from the return) rather than relying on a `catch`.
- **Immutable history cache.** `useWorkflowHistory` uses `staleTime: Infinity`
  because the audit trail is append-only; a successful `useExecuteTransition`
  invalidates the whole workflow query key, which refetches it.
- **State-machine endpoint carries no entity context.** `useTransitions` /
  `useExecuteTransition` operate on a bare `currentState` (the
  `…/transitions` route); per-entity history is the only entity-scoped surface.
- **Authorization is server-enforced.** Permission constants live in
  `@granit/workflow` (`WorkflowPermissions`); client-side checks are a UX hint,
  and `Granit.Workflow` re-validates every transition on the backend.

## License

Apache-2.0
