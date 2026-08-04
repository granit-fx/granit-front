# @granit/react-ui-ai

Admin UI for the Granit **AI** module — the workspace management surface (list /
grid with a view switcher, create and edit forms with provider/model selection,
capabilities badges, a delete confirmation and an inline chat/embeddings test
panel) plus the query-driven **AI usage tracking** grid.

This is the **react-ui admin feature kit**: the visual layer. It composes the
headless [`@granit/react-ai`](../react-ai) (provider + React Query hooks, plus its
opt-in `@granit/react-ai/usage` querying surface) with the foundation UI packages
([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and gates management actions
with [`@granit/react-authorization`](../react-authorization) `usePermissions`. It
holds no Axios call or DTO of its own — those live in the lower layers.

The split is three packages over the same .NET `Granit.AI.Endpoints` backend
(contract: `contracts/openapi/ai.json`):

- [`@granit/ai`](../ai) — framework-agnostic core: DTOs, Axios functions,
  `AIPermissions`, and the `AI_WORKSPACE_*` constants.
- [`@granit/react-ai`](../react-ai) — React Query hooks + `AIProvider`
  (and the `@granit/react-ai/usage` subpath: `AIUsageProvider`, `useAIUsage`).
- `@granit/react-ui-ai` (this package) — admin pages, tables, forms, dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/ai` — core DTOs (`AIWorkspaceResponse`, `AIUsageRecord`,
  `AIModelCapabilities`), `AIPermissions`, and the `AI_WORKSPACE_LIMITS` /
  `AI_WORKSPACE_KINDS` constants the pages and schemas read.
- `@granit/react-ai` — the headless hooks/providers this kit renders (`AIProvider`,
  `useAIWorkspaces`, `useCreateAIWorkspace`, `useAIChatStream`, …) including the
  `/usage` subpath.
- `@granit/react-authorization` — `usePermissions` for action gating.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-ui` — shadcn/ui primitives (`Card`, `Form`, `Table`, `Tabs`,
  `AlertDialog`, `toast`, …).
- `@granit/react-ui-admin-kit` — `ViewSwitcher`, `QueryDataTable`, `SortSelector`,
  `GroupBySelector` for the usage grid.
- `@granit/react-query-engine` + `@granit/query-engine` — the query surface the
  usage page drives.
- `@granit/logger` — `createLogger` for the page-level error logging.
- `react` / `react-dom` (`^19`), `react-router` (`^7.18`) — `Link` /
  `useNavigate` / `useParams` power the list-to-detail navigation.
- `react-hook-form` (`^7.80`) + `@hookform/resolvers` (`^5.4`) + `zod` (`^4.4`) —
  the workspace forms.
- `@tanstack/react-table` (`^8.21`) — `WorkspaceTable` column model.
- `lucide-react` (`^1.21`) — icons.

## Quick start

The pages are self-contained; mount them under a `GranitClientProvider` and the
headless `AIProvider` (from `@granit/react-ai`), register the bundled `AI.*`
strings, and wire the four routes. `AIUsagePage` wraps its own `AIUsageProvider`
internally, so no extra usage provider is needed.

```tsx
import {
  AIWorkspaceListPage,
  AIWorkspaceCreatePage,
  AIWorkspaceEditPage,
  AIUsagePage,
  aiTranslationsEn,
} from '@granit/react-ui-ai';
import { AIProvider } from '@granit/react-ai';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router';

i18n.addResourceBundle('en', 'translation', aiTranslationsEn, true, true);

function AIRoutes() {
  // The route param is `:name` — the page resolves the workspace by its `key`.
  return (
    <AIProvider config={{ client: useGranitClient() }}>
      <Routes>
        <Route path="/ai/workspaces" element={<AIWorkspaceListPage />} />
        <Route path="/ai/workspaces/new" element={<AIWorkspaceCreatePage />} />
        <Route path="/ai/workspaces/:name" element={<AIWorkspaceEditPage />} />
        <Route path="/ai/usage" element={<AIUsagePage />} />
      </Routes>
    </AIProvider>
  );
}
```

The edit page renders read-only (`WorkspaceDetail`) for **system** workspaces or
when the user lacks `AI.Workspaces.Manage`, and shows the `WorkspaceTestPanel`
only while the workspace is activated. The lower-level components are exported for
apps that want to assemble a bespoke surface:

```tsx
import {
  WorkspaceForm,
  createWorkspaceColumns,
  WorkspaceTable,
  type CreateWorkspaceFormValues,
} from '@granit/react-ui-ai';
import { useCreateAIWorkspace } from '@granit/react-ai';

function NewWorkspace() {
  const { createAsync, isPending } = useCreateAIWorkspace();
  const onSubmit = async (values: CreateWorkspaceFormValues) => {
    await createAsync({
      key: values.key,
      provider: values.provider,
      model: values.model,
      displayName: values.displayName || null,
      systemPrompt: values.systemPrompt || null,
      temperature: values.temperature ? Number(values.temperature) : null,
      maxOutputTokens: values.maxOutputTokens ? Number(values.maxOutputTokens) : null,
    });
  };
  return (
    <WorkspaceForm mode="create" onSubmit={onSubmit} onCancel={() => {}} isPending={isPending} />
  );
}
```

## Public API

| Symbol                      | Kind      | Purpose                                                                |
| --------------------------- | --------- | ---------------------------------------------------------------------- |
| `AIWorkspaceListPage`       | component | List/grid of workspaces with view switcher, create CTA, delete dialog  |
| `AIWorkspaceCreatePage`     | component | Create-mode form page; navigates to the new workspace on success       |
| `AIWorkspaceEditPage`       | component | Edit page (read-only for system / unprivileged) + activated test panel |
| `AIUsagePage`               | component | Query-engine usage grid; self-wraps its `AIUsageProvider`              |
| `WorkspaceTable`            | component | TanStack-table view of `AIWorkspaceResponse[]` with row-click          |
| `createWorkspaceColumns`    | fn        | Column factory (key/provider/model/kind/status + row-action menu)      |
| `WorkspaceForm`             | component | Discriminated create/edit form (provider→model cascade, key slugify)   |
| `WorkspaceDetail`           | component | Read-only workspace view for system / non-manage users                 |
| `WorkspaceCapabilities`     | component | Capability badges from `AIModelCapabilities` (+ `extensions`)          |
| `WorkspaceDeleteDialog`     | component | Confirm dialog; disabled for system workspaces                         |
| `WorkspaceTestPanel`        | component | Inline chat-stream / embeddings tester, capability + permission gated  |
| `createWorkspaceSchema`     | fn        | Zod schema for create (key/provider/model + tuning), i18n-aware        |
| `editWorkspaceSchema`       | fn        | Zod schema for edit (no key; adds `activated`)                         |
| `CreateWorkspaceFormValues` | type      | `z.infer` of the create schema                                         |
| `EditWorkspaceFormValues`   | type      | `z.infer` of the edit schema                                           |
| `aiTranslationsEn`          | const     | English `AI.*` resource bundle for the host to register                |
| `aiTranslationsFr`          | const     | French `AI.*` resource bundle                                          |

## Injection

- **API client** — the headless `AIProvider` (and `AIUsageProvider`, which the
  usage page wraps internally) resolves the Axios client from a
  `GranitClientProvider` higher in the tree (via `@granit/react-api-client`). No
  client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  create / edit / delete actions and the test panel (`AIPermissions.Workspaces.Manage`,
  `.Chat.Execute`, `.Embeddings.Execute`). System workspaces are configuration-defined
  and always render read-only.
- **Routing** — `react-router` (`Link` / `useNavigate` / `useParams`) for the
  list-to-detail navigation and the back links. The detail route param is `:name`,
  but the workspace is keyed by its `key` slug throughout.
- **i18n** — ships its `AI.*` strings (`aiTranslationsEn` / `aiTranslationsFr`); the
  host registers them. Host-owned `Common.*` / `Validation.*` keys are expected from
  the app and are **not** bundled here.

## Caveats

- **Client-side gating is a UX hint, not a security boundary.** Hiding the create /
  edit / delete controls behind `hasPermission` only declutters the UI; every
  workspace mutation, chat completion, and embedding request is independently
  re-authorized by `Granit.AI.Endpoints`. See
  [`@granit/react-authorization`](../react-authorization) for the full posture.
- **System vs. dynamic workspaces.** `kind === AI_WORKSPACE_KINDS.SYSTEM` workspaces
  come from backend configuration: they are never editable or deletable through this
  UI (the form falls back to `WorkspaceDetail`, the delete action is suppressed and
  the dialog's confirm is disabled). Only dynamic workspaces are user-managed.
- **The test panel runs real calls.** `WorkspaceTestPanel` issues live chat-stream
  and embedding requests against the selected workspace's provider — it consumes
  tokens and is metered into the usage grid. It is double-gated on the model's
  advertised `capabilities` and the `Chat.Execute` / `Embeddings.Execute` permissions,
  and renders nothing when neither applies.
- **i18n is the caller's job for shared keys.** This kit owns only the `AI.*`
  namespace; `Common.*` and `Validation.*` keys (used by the schemas and buttons)
  must be provided by the host app's bundles.

## Out of scope

- **HTTP transport, DTOs, hooks** — owned by [`@granit/ai`](../ai) (mirror of
  `Granit.AI.Endpoints`) and [`@granit/react-ai`](../react-ai). This package only
  renders them.
- **Conversational chat UX** — the persistent assistant chat experience is a
  separate feature kit, [`@granit/react-ui-ai-chat`](../react-ui-ai-chat) over
  [`@granit/react-ai-chat`](../react-ai-chat). The test panel here is a throwaway
  workspace smoke test, not a chat surface.
- **Prompt library management** — [`@granit/react-ui-ai-prompts`](../react-ui-ai-prompts).
- **Authentication** — the already-authenticated Axios client is consumed; token
  issuance/refresh belongs to the BFF and `@granit/authentication`.

## License

Apache-2.0
