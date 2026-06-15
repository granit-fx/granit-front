# @granit/ai-prompts

Framework-agnostic types and API functions for the AI prompt catalogue. Mirrors
the `Granit.AI.Prompts.Endpoints` .NET contract (prefix `/prompts`).

This is the core, headless layer: DTOs, prompt CRUD, the `/` picker payload,
and copy-on-customise. React bindings (hooks, picker popover, catalogue
manager, icon picker) live in `@granit/react-ai-prompts`.

## Installation

```bash
pnpm add @granit/ai-prompts
```

## API

### Types

- `PromptSummaryResponse`, `PromptResponse` — catalogue read models (`isSystem`
  marks read-only framework prompts; user prompts are owner-private).
- `PromptPickerResponse`, `PromptPickerCategoryResponse`, `PromptPickerItemResponse`
  — the `/` picker grouped by category (`categoryId: null` ⇒ "General").
- `CreatePromptRequest`, `UpdatePromptRequest` — write bodies.
- `PromptId`, `CategoryId` — branded identifiers.

> `icon` is an identifier string — the front owns the glyph set. `iconColor` is a
> hex string `#RRGGBB` / `#RRGGBBAA` (see `ICON_COLOR_PATTERN`). System prompts'
> `name` / `shortDescription` arrive already localized.

### Constants

- `PROMPT_LIMITS`, `ICON_COLOR_PATTERN`, `GENERAL_CATEGORY_NAME`.

### Functions

- `listPrompts`, `getPromptPicker`, `getPrompt`, `createPrompt`, `updatePrompt`,
  `deletePrompt` — JSON CRUD over the Axios client.
- `customisePrompt` — clones a **system** prompt into a private editable copy
  (`POST /prompts/{id}/customise`); a non-system target returns 409. System
  prompts are read-only: `PUT` / `DELETE` on one returns 404, so the UI offers
  **Customise** instead of Edit/Delete when `isSystem` is `true`.

### Permissions

`AIPromptsPermissions.Templates.{Read,Manage,Delete}` — the server enforces
them; the client only gates affordances.
