# @granit/react-ui-ai-prompts

Admin UI for the **AI Prompts** module — the prompt-catalogue management page: a
list with customise (system prompts) / edit / delete (own prompts) affordances, a
create-and-edit dialog form and a delete confirmation.

The **visual** layer for AI prompts: it composes the headless
[`@granit/react-ai-prompts`](../react-ai-prompts) (hooks + `PromptCatalogue` /
`PromptForm` components) with the foundation UI package
([`@granit/react-ui`](../react-ui)) and gates management actions with
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

## Usage

```tsx
import { PromptCataloguePage, aiPromptsAdminTranslationsEn } from '@granit/react-ui-ai-prompts';

i18n.addResourceBundle('en', 'translation', aiPromptsAdminTranslationsEn, true, true);

// Mount under a GranitClientProvider + AIPromptsProvider (from the headless package):
<Route path="/ai/prompts" element={<PromptCataloguePage />} />;
```

## Injection

- **API client** — the headless hooks (`usePrompts`, `useCreatePrompt`, …) resolve
  the Axios client from the `AIPromptsProvider` / `GranitClientProvider` higher in
  the tree. No client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  manage / delete affordances (`AIPromptsPermissions.Templates.Manage` /
  `.Delete`). The server re-checks regardless.
- **i18n** — ships its `AiPrompts.*` strings
  (`aiPromptsAdminTranslationsEn/Fr` — the `Admin` infix avoids colliding with the
  headless package's `aiPromptsTranslationsEn/Fr`); the host registers them.
