# @granit/ai-prompts

Framework-agnostic **AI prompt catalogue** SDK — the TypeScript counterpart of
the .NET `Granit.AI.Prompts.Endpoints` module (route prefix `/prompts`). It
exposes the DTOs, Axios HTTP client and permission constants needed to drive
prompt CRUD, the chat picker payload, and copy-on-customise from any client —
React, React Native, a CLI, tests. It holds **no** React, DOM or Node-only
dependency.

This is the headless core layer. React Query hooks and providers live in
[`@granit/react-ai-prompts`](../react-ai-prompts); the admin feature kit
(catalogue manager, picker popover, icon picker) lives in
[`@granit/react-ui-ai-prompts`](../react-ui-ai-prompts).

The catalogue mixes two ownership kinds. **System prompts** (`isSystem: true`)
are read-only framework templates with pre-localized `name` /
`shortDescription`; `PUT` / `DELETE` on one returns 404, so the UI offers
**Customise** (clone into a private copy) instead of Edit/Delete. **User
prompts** are owner-private — never build cross-user views.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios client (interceptors: CSRF,
  auth, tenant); supplies the `AxiosInstance` every API function takes.
- `@granit/types` — branded id and date primitives (`EntityId`, `UserId`,
  `ISODateString`).

## Quick start

```ts
import {
  listPrompts,
  getPromptPicker,
  customisePrompt,
  createPrompt,
  type PromptId,
} from '@granit/ai-prompts';

// `basePath` is the `/prompts` collection root.
const basePath = '/api/v1/prompts';

// 1. List the caller's catalogue (system prompts first, then own), no text.
const summaries = await listPrompts(client, basePath);

// 2. The picker payload grouped by category for the chat slash-command UI.
//    A group with `categoryId: null` is the "General" (uncategorised) bucket.
const picker = await getPromptPicker(client, basePath);

// 3. Create a private prompt owned by the caller.
const mine = await createPrompt(client, basePath, {
  name: 'Summarise thread',
  content: 'Summarise the conversation above in three bullet points.',
});

// 4. A system prompt is read-only — clone it into an editable private copy
//    instead of editing in place.
const systemId = summaries.find((p) => p.isSystem)?.id as PromptId;
const editableCopy = await customisePrompt(client, basePath, systemId);
```

## Public API

| Symbol                         | Kind  | Purpose                                                  |
| ------------------------------ | ----- | -------------------------------------------------------- |
| `PromptId`                     | type  | Branded prompt-template id (`EntityId<'Prompt'>`)        |
| `CategoryId`                   | type  | Branded taxonomy category id (`EntityId<'Category'>`)    |
| `PromptSummaryResponse`        | type  | Catalogue list item, without instruction text            |
| `PromptResponse`               | type  | Full prompt with `content`, `version`, `ownerId`, audit  |
| `PromptPickerResponse`         | type  | `/picker` payload - categories grouped                   |
| `PromptPickerCategoryResponse` | type  | One picker group (`categoryId: null` = General bucket)   |
| `PromptPickerItemResponse`     | type  | One picker entry (no instruction text)                   |
| `CreatePromptRequest`          | type  | `POST {basePath}` body                                   |
| `UpdatePromptRequest`          | type  | `PUT {basePath}/{id}` body (same shape as create)        |
| `listPrompts`                  | fn    | `GET {basePath}` - caller's catalogue summaries          |
| `getPromptPicker`              | fn    | `GET {basePath}/picker` - catalogue grouped by category  |
| `getPrompt`                    | fn    | `GET {basePath}/{id}` - one prompt with its text         |
| `createPrompt`                 | fn    | `POST {basePath}` - create a private prompt              |
| `updatePrompt`                 | fn    | `PUT {basePath}/{id}` - update own prompt, bumps version |
| `deletePrompt`                 | fn    | `DELETE {basePath}/{id}` - delete own prompt             |
| `customisePrompt`              | fn    | `POST {basePath}/{id}/customise` - clone a system prompt |
| `PROMPT_LIMITS`                | const | Server-enforced max lengths (name, content, etc.)        |
| `ICON_COLOR_PATTERN`           | const | Hex `#RRGGBB` / `#RRGGBBAA` validation regex             |
| `GENERAL_CATEGORY_NAME`        | const | Group name for uncategorised prompts (`'General'`)       |
| `AIPromptsPermissions`         | const | `Templates.{Read,Manage,Delete}` permission keys         |

### Field optionality

DTO optionality follows the OpenAPI `required` array, not C# nullability.
`icon` and `iconColor` are **required keys with nullable values**
(`string | null`) on read models — the front owns the glyph set, and
`iconColor` is a hex string matched by `ICON_COLOR_PATTERN`. On write bodies
they are genuinely optional (`?`). System prompts arrive with `name` /
`shortDescription` already localized.

## Out of scope / caveats

- **Permission checks are a UX hint, not a boundary.**
  `AIPromptsPermissions.Templates.{Read,Manage,Delete}` let the UI hide
  affordances the user cannot use; the .NET backend re-enforces every call.
  Never fetch then hide.
- **Owner privacy.** User prompts are owner-private. There is no cross-user
  or admin listing route — do not build one client-side.
- **System prompts are read-only.** `updatePrompt` / `deletePrompt` on an
  `isSystem` prompt return 404; `customisePrompt` on a non-system prompt
  returns 409. Gate the UI on `isSystem`.
- **No React, no DOM.** Hooks, query-key factories and UI components are not
  here — see [`@granit/react-ai-prompts`](../react-ai-prompts) and
  [`@granit/react-ui-ai-prompts`](../react-ui-ai-prompts).

## License

Apache-2.0
