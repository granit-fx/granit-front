# @granit/react-ui-ai-prompts

Admin UI for the **AI Prompts** module — a single drop-in management page for the
prompt catalogue: a list with customise (system prompts) / edit / delete (own
prompts) affordances, a create-and-edit dialog form, and a delete confirmation.

This is the **react-ui admin feature kit** (the visual layer). It composes the
headless [`@granit/react-ai-prompts`](../react-ai-prompts) (TanStack Query hooks +
the `PromptCatalogue` / `PromptForm` components) with the foundation UI package
[`@granit/react-ui`](../react-ui) (dialog primitives), gates management actions
through [`@granit/react-authorization`](../react-authorization) `usePermissions`,
and localizes via [`@granit/react-localization`](../react-localization). It owns no
data fetching, no HTTP transport, and no headless components — it only wires them
into a page. The backend counterpart is `Granit.AI.Prompts`
(contract: `contracts/openapi/ai-prompts.json`).

The split is three packages over the same backend:

- [`@granit/ai-prompts`](../ai-prompts) — framework-agnostic core: DTOs, Axios
  calls (`listPrompts`, `createPrompt`, …), `AIPromptsPermissions`, branded ids.
- [`@granit/react-ai-prompts`](../react-ai-prompts) — headless React layer:
  `AIPromptsProvider`, query/mutation hooks, and the `PromptCatalogue` /
  `PromptForm` / `PromptPicker` components.
- `@granit/react-ui-ai-prompts` (this package) — the assembled admin page.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/ai-prompts` — core DTOs + `AIPromptsPermissions` (the permission
  constants this page gates on).
- `@granit/react-ai-prompts` — headless hooks + `PromptCatalogue` / `PromptForm`
  this page assembles.
- `@granit/react-authorization` — `usePermissions`, for gating manage / delete
  affordances.
- `@granit/react-localization` — `useTranslation`, for the `AiPrompts.*` strings.
- `@granit/react-ui` — `Dialog` / `AlertDialog` primitives.
- `react` and `react-dom` (`^19`).

## Quick start

Register the admin strings, then mount the page below the headless
`AIPromptsProvider` (which itself sits under a `GranitClientProvider` and a
TanStack Query client so the hooks can resolve the Axios client and cache). The
page resolves the API client, permissions, and i18n from context — nothing is
baked in.

```tsx
import { AIPromptsProvider } from '@granit/react-ai-prompts';
import { useGranitClient } from '@granit/react-api-client';
import { PromptCataloguePage, aiPromptsAdminTranslationsEn } from '@granit/react-ui-ai-prompts';
import { Route } from 'react-router';

// Flat `AiPrompts.*` keys — register with key/namespace separators disabled so the
// dotted keys are looked up verbatim (the `true, true` flags below do that).
i18n.addResourceBundle('en', 'translation', aiPromptsAdminTranslationsEn, true, true);

function AiPromptsRoutes() {
  return (
    <AIPromptsProvider config={{ client: useGranitClient() }}>
      <Route path="/ai/prompts" element={<PromptCataloguePage />} />
    </AIPromptsProvider>
  );
}
```

`<PromptCataloguePage />` takes no props. It calls `usePrompts()` for the list,
gates the **New** / **Edit** controls on `AIPrompts.Templates.Manage` and the
**Delete** control on `AIPrompts.Templates.Delete`, and drives create / update /
delete / customise through the headless mutation hooks. System prompts are
read-only and surface a **Customise** affordance (server-side copy into an editable
user prompt); own prompts surface **Edit** / **Delete**.

## Public API

| Symbol                         | Kind      | Purpose                                                            |
| ------------------------------ | --------- | ------------------------------------------------------------------ |
| `PromptCataloguePage`          | component | The prompt-catalogue management page (props-less; reads context)   |
| `aiPromptsAdminTranslationsEn` | const     | English `AiPrompts.*` strings (flat dotted keys, `translation` ns) |
| `aiPromptsAdminTranslationsFr` | const     | French `AiPrompts.*` strings                                       |

The translation bundles carry the `Admin` infix on purpose: the headless
[`@granit/react-ai-prompts`](../react-ai-prompts) already exports
`aiPromptsTranslationsEn/Fr`, so the infix avoids a barrel-name collision when a
host imports both. Register both bundles into the same `translation` namespace.

## Out of scope / caveats

- **Headless logic lives upstream.** Hooks (`usePrompts`, `useCreatePrompt`,
  `useCustomisePrompt`, …) and the reusable `PromptCatalogue` / `PromptForm` /
  `PromptPicker` components belong to
  [`@granit/react-ai-prompts`](../react-ai-prompts); DTOs, Axios calls, and
  `AIPromptsPermissions` belong to [`@granit/ai-prompts`](../ai-prompts). This
  package only assembles them into a page.
- **No baked-in client.** The page resolves the Axios client from the
  `AIPromptsProvider` / `GranitClientProvider` higher in the tree — mount one, or
  the hooks have nothing to call.
- **Permission gating is a UX hint, not enforcement.** `usePermissions` only hides
  the manage / delete affordances; the `Granit.AI.Prompts` backend re-checks
  `AIPrompts.Templates.Manage` / `.Delete` on every request. User prompts are
  owner-private server-side — never assume the catalogue is a cross-user view.
- **i18n is host-owned.** The host application must register
  `aiPromptsAdminTranslationsEn/Fr` (separators disabled). Missing strings fall
  back to the inline English defaults passed to `t(key, default)`.

## License

Apache-2.0
