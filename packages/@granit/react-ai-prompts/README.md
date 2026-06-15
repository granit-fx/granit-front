# @granit/react-ai-prompts

React bindings for [`@granit/ai-prompts`](../ai-prompts) — the AI prompt
catalogue. Provides the `AIPromptsProvider`, catalogue CRUD + customise hooks,
the `/` picker hook, and (on top of these) the picker popover, an icon picker,
and the catalogue manager UI.

## Installation

```bash
pnpm add @granit/react-ai-prompts
```

## Usage

```tsx
import { AIPromptsProvider } from '@granit/react-ai-prompts';

<AIPromptsProvider config={{ client }}>{children}</AIPromptsProvider>;
```

### Hooks

- `usePrompts()` — the flat catalogue (system first), for the manager.
- `usePromptPicker()` — the catalogue grouped by category for the chat `/`
  picker. Flatten its items into `@granit/react-ai-chat`'s `<ChatComposer prompts>`.
- `usePrompt(id)` — one prompt with its instruction text (edit form).
- `useCreatePrompt()` / `useUpdatePrompt()` / `useDeletePrompt()` — mutations
  that invalidate the list, picker, and affected detail.
- `useCustomisePrompt()` — clones a **system** prompt into a private editable
  copy (system prompts are read-only — offer Customise instead of Edit/Delete).
- `promptKeys` — the query-key factory.

## Testing

`@granit/react-ai-prompts/testing` exports `createAIPromptsHandlers(baseUrl)`
(stateful MSW handlers enforcing the system-prompt read-only / customise / 409
semantics) plus `mockPromptSummaries`, `mockPromptPicker`, `mockSystemPrompt`,
and `mockUserPrompt`.
