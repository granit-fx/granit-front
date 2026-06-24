# @granit/react-ai-prompts

React bindings for the AI **prompt catalogue** — the React hooks + providers
layer over [`@granit/ai-prompts`](../ai-prompts), the framework-agnostic core
that mirrors the .NET `Granit.AI.Prompts` module (endpoints in
`Granit.AI.Prompts.Endpoints`, contract `contracts/openapi/ai-prompts.json`).

This package wires the core's HTTP client and types into a React context
(`AIPromptsProvider`), exposes React Query hooks for the catalogue (list, detail,
the `/` picker, and the create / update / delete / customise mutations), and
ships a set of **headless, Tailwind-styled** building blocks (picker, catalogue
manager, prompt form, icon picker). It owns the prompt **glyph registry** — the
backend stores an icon *identifier* string, never a component. The admin feature
kit (page, dialogs, permission gating) lives one layer up in
[`@granit/react-ui-ai-prompts`](../react-ui-ai-prompts). Sibling AI packages:
[`@granit/react-ai-chat`](../react-ai-chat) consumes the picker for its
`<ChatComposer prompts>` slot.

The catalogue holds two kinds of prompt: **system** prompts (read-only, shared)
and the caller's **own** prompts (owner-private). System prompts are never
edited or deleted in place — they are cloned via *customise* into a private,
editable copy.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. Declare the peers a consumer needs:

- `@granit/ai-prompts` — core types, API functions, permission constants.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — provides the `GranitClientProvider` /
  `useOptionalGranitClient` fallback the provider reads when no explicit client
  is passed.
- `@granit/types`, `@granit/utils` — shared utilities (`cn`, branded ids).
- `@tanstack/react-query` (^5), `react` (^19), `lucide-react` (^1) — query
  hooks, JSX, and the glyph set.
- `msw` (^2, **optional**) — only for the `/testing` MSW handlers.

## Quick start

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AIPromptsProvider,
  usePromptPicker,
  usePrompts,
  useCustomisePrompt,
  PromptCatalogue,
} from '@granit/react-ai-prompts';
import type { AxiosInstance } from '@granit/api-client';

// `client` carries the auth/CSRF/tenant interceptors. Omit it to fall back to
// the ambient <GranitClientProvider>. `basePath` defaults to /api/v1/prompts.
function App({ client }: { client: AxiosInstance }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AIPromptsProvider config={{ client }}>
        <CatalogueManager />
      </AIPromptsProvider>
    </QueryClientProvider>
  );
}

function CatalogueManager() {
  const { data: prompts = [] } = usePrompts();
  const { customise } = useCustomisePrompt();

  // System prompts surface "Customise" instead of Edit/Delete; affordances are
  // gated by canManage/canDelete and the server re-checks the permission.
  return (
    <PromptCatalogue prompts={prompts} canManage onCustomise={customise} />
  );
}

// The `/` picker: feed the flattened items to <ChatComposer prompts> in
// @granit/react-ai-chat, or render the standalone <PromptPicker> directly.
function ChatPrompts() {
  const { data } = usePromptPicker();
  return data?.categories.flatMap((c) => c.prompts) ?? [];
}
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `AIPromptsProvider` | provider | Supplies the Axios client + resolved config to all hooks |
| `useAIPromptsConfig` | hook | Reads the resolved config from the nearest provider |
| `AIPromptsConfig` | type | Provider input: `client?`, `basePath?`, `queryKeyPrefix?` |
| `ResolvedAIPromptsConfig` | type | Config after the provider applies defaults |
| `AIPromptsProviderProps` | type | `{ config, children }` |
| `promptKeys` | const | Query-key factory (`all` / `list` / `picker` / `detail`) |
| `usePrompts` | hook | List the caller's catalogue (system first, no instruction text) |
| `usePrompt` | hook | One prompt with its instruction text; `null` id disables it |
| `usePromptPicker` | hook | Catalogue grouped by category for the `/` picker |
| `useCreatePrompt` | hook | Create a private prompt; invalidates list + picker |
| `useUpdatePrompt` | hook | Update an own prompt; invalidates list, picker, detail |
| `useDeletePrompt` | hook | Delete an own prompt; invalidates list + picker |
| `useCustomisePrompt` | hook | Clone a system prompt into a private editable copy |
| `UseCreatePromptReturn` | type | `{ create, createAsync, isPending, error }` |
| `UseUpdatePromptReturn` | type | `{ update, updateAsync, isPending, error }` |
| `UpdatePromptVariables` | type | `{ id, request }` for `useUpdatePrompt` |
| `UseDeletePromptReturn` | type | `{ remove, removeAsync, isPending, error }` |
| `UseCustomisePromptReturn` | type | `{ customise, customiseAsync, isPending, error }` |
| `PromptCatalogue` | component | List with new / edit / delete / customise affordances |
| `PromptPicker` | component | Standalone searchable `/` picker (ARIA combobox) |
| `PromptForm` | component | Create/edit form emitting a `CreatePromptRequest` |
| `IconPicker` | component | Glyph radiogroup + hex colour (swatch and text) |
| `PromptIcon` | component | Renders a prompt's glyph in its configured colour |
| `PromptCatalogueProps`, `PromptPickerProps`, `PromptFormProps`, `PromptFormValues`, `IconPickerProps`, `PromptIconProps` | type | Component prop / value shapes |
| `PROMPT_ICONS` | const | Identifier → `LucideIcon` glyph map (front-owned) |
| `PROMPT_ICON_IDS` | const | Selectable icon identifiers (picker grid order) |
| `DEFAULT_PROMPT_ICON` | const | Fallback identifier (`'sparkles'`) |
| `getPromptIcon` | fn | Resolve an identifier to a glyph, falling back to default |
| `aiPromptsTranslationsEn`, `aiPromptsTranslationsFr`, `defaultPromptLabels` | const | i18next label bundles (`defaultPromptLabels` = the EN defaults) |
| `PromptTranslations` | type | Shape of a label bundle |

Domain types (`PromptId`, `PromptResponse`, `PromptSummaryResponse`,
`CreatePromptRequest`, `PromptPickerResponse`, …) and the core API functions are
re-exported from [`@granit/ai-prompts`](../ai-prompts) — import them from there.

### Testing

`@granit/react-ai-prompts/testing` exports `createAIPromptsHandlers(baseUrl?)` —
**stateful** MSW handlers whose create / update / delete / customise calls mutate
an in-memory catalogue reflected by later GETs, and which enforce the wire
semantics (system prompts return 404 on PUT/DELETE; customising a non-system
prompt returns 409). It also exports the fixtures `mockPromptSummaries`,
`mockPromptPicker`, `mockSystemPrompt`, and `mockUserPrompt`. Import these
instead of hand-rolling DTOs in tests.

## Caveats

- **Client gating is a UX hint, not a security boundary.** `canManage` /
  `canDelete` on `PromptCatalogue` (and the `enabled` flags) only hide controls
  and skip fetches; the backend re-checks `AIPrompts.Templates.{Manage,Delete}`
  (`AIPromptsPermissions` in `@granit/ai-prompts`) on every call. Never render
  data the current user is not authorized to see.
- **System prompts are read-only.** Offer **Customise** (clone) instead of
  Edit/Delete. `useUpdatePrompt` / `useDeletePrompt` against a system prompt
  return 404; `useCustomisePrompt` against a non-system prompt returns 409.
- **User prompts are owner-private.** The list returns the caller's own prompts
  plus the shared system ones — never build cross-user catalogue views.
- **Icons are an app concern.** The catalogue persists an icon *identifier*
  string and a hex colour; the front owns the `PROMPT_ICONS` glyph map and may
  extend it. An unknown identifier resolves to `DEFAULT_PROMPT_ICON`.
- **i18n is the caller's job.** Components render with English defaults
  (`defaultPromptLabels`) when no `labels` prop is passed; apps register the
  `aiPromptsTranslationsEn` / `aiPromptsTranslationsFr` bundles with i18next and
  pass translated labels down.

## License

Apache-2.0
