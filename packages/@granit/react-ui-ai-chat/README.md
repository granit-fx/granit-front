# @granit/react-ui-ai-chat

Admin **UI feature kit** for the AI Chat module — the agentic chat workspace (a
conversation sidebar with pin / rename / delete, a streamed thread, the `/` `@`
composer with a branded model picker, and per-message copy / regenerate / report
actions) plus the per-user chat-preferences page.

This is the **react-ui** (visual) layer of the AI Chat split, backed by the .NET
`Granit.AiChat` module (contract: `contracts/openapi/ai-chat.json`). It composes
the headless [`@granit/react-ai-chat`](../react-ai-chat) (provider + hooks +
framework chat components) with the foundation UI ([`@granit/react-ui`](../react-ui))
and the adjacent AI packages into ready-to-route pages. The framework-agnostic
DTOs/constants live in [`@granit/ai-chat`](../ai-chat); React Query hooks and the
streaming logic live in `@granit/react-ai-chat`; this package renders them. It
holds no Axios calls and no query keys of its own.

It draws on the surrounding AI surface: [`@granit/react-ai`](../react-ai) for the
admin workspace list (model labels + brand hints), [`@granit/react-ai-prompts`](../react-ai-prompts)
for the `/` prompt picker, [`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage)
for `@` attachments, and [`@granit/react-settings`](../react-settings) for the
preferences page (persisted on the `user` settings scope — there is no
chat-specific settings route).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must mount the
AI providers above these pages and declare the peers below:

- `@granit/react-ai-chat`, `@granit/react-ai`, `@granit/react-ai-prompts`,
  `@granit/react-ai-chat-blob-storage`, `@granit/react-blob-storage` — the
  headless providers + hooks + framework chat components this kit renders.
- `@granit/ai-chat` — core DTOs and constants (`AUTO_WORKSPACE`,
  `MESSAGE_REPORT_CATEGORIES`, `MessageReportCategory`, …).
- `@granit/react-settings` / `@granit/settings` — `useSettings` / `useUpdateSetting`
  on the `user` scope for the preferences page.
- `@granit/react-ui` — the shadcn/ui foundation (buttons, dialogs, selects, `toast`).
- `@granit/react-localization` — `useTranslation`; this kit ships `AiChat.*` strings.
- `@granit/logger` — `createLogger`, for the copy/report failure paths.
- `react` / `react-dom` (`^19`) and `react-router-dom` (`^7`) — `useNavigate` /
  `useParams` drive conversation selection (`/ai/chat/:id`) and "new chat".
- `dompurify` (`^3`), `marked` (`^18`), `lucide-react` (`^1`) — Markdown→clipboard
  sanitisation and icons.

## Quick start

Register the bundled strings, mount the AI providers (each resolves the Axios
client from a `GranitClientProvider` higher in the tree), then route the pages.

```tsx
import { ChatPage, ChatSettingsPage, aiChatAdminTranslationsEn } from '@granit/react-ui-ai-chat';
import { Route, Routes } from 'react-router-dom';

i18n.addResourceBundle('en', 'translation', aiChatAdminTranslationsEn, true, true);

function ChatRoutes() {
  // Render under <AIProvider> / <AIChatProvider> / <AIPromptsProvider> /
  // <BlobStorageProvider> (from the @granit/react-ai* packages); they supply the
  // client, base paths, and query keys. No client is baked into these pages.
  return (
    <Routes>
      <Route path="/ai/chat" element={<ChatPage />} />
      <Route path="/ai/chat/:conversationId" element={<ChatPage />} />
      <Route path="/ai/chat/settings" element={<ChatSettingsPage />} />
    </Routes>
  );
}
```

`ChatPage` reads the selected conversation from the URL (`/ai/chat/:id`, so each
chat is shareable and reload-safe; `/ai/chat` is a fresh chat). For embedding the
pieces directly, the leaf components and the clipboard/model-picker helpers are
exported too:

```tsx
import {
  ChatMessageActions,
  ConversationListItem,
  ProviderIcon,
  buildWorkspaceOptions,
  copyMessage,
} from '@granit/react-ui-ai-chat';

// Decorate the BFF's flat workspace names with model marks + capability glyphs
// for the composer's picker (model id drives the brand icon, display name the label):
const options = buildWorkspaceOptions(['general-chat', 'translation'], t, modelNames, models);

// Sanitised Markdown → clipboard (HTML / Markdown / plain); rejects on failure.
await copyMessage(assistantMarkdown, 'html');

// Brand glyph for a provider; unknown keys fall back to a generic bot mark.
<ProviderIcon provider="anthropic" className="size-4" />;
```

## Public API

| Symbol                      | Kind      | Purpose                                                                  |
| --------------------------- | --------- | ------------------------------------------------------------------------ |
| `ChatPage`                  | component | Full chat workspace: sidebar + streamed thread + `/` `@` composer        |
| `ChatSettingsPage`          | component | Per-user chat preferences (default workspace, web-search, context)       |
| `ChatMessageActions`        | component | Per-message row: copy / regenerate / report (with a report dialog)       |
| `ChatMessageActionsProps`   | type      | Props for `ChatMessageActions` (content, isAssistant, onReport, ...)     |
| `ConversationListItem`      | component | Sidebar row: open + kebab to pin / rename / delete (with dialogs)        |
| `ConversationListItemProps` | type      | Props for `ConversationListItem` (title, isPinned, onRename, ...)        |
| `ProviderIcon`              | component | Monochrome AI-vendor brand glyph; unknown provider gets a generic mark   |
| `buildWorkspaceOptions`     | fn        | Decorate flat workspace names into rich `WorkspaceOption[]` for picker   |
| `copyMessage`               | fn        | Write a Markdown message to the clipboard in a `CopyFormat` (sanitised)  |
| `markdownToClipboard`       | fn        | Markdown to html / markdown / plain string (HTML run through DOMPurify)  |
| `CopyFormat`                | type      | `'html'`, `'markdown'`, or `'plain'`                                     |
| `aiChatAdminTranslationsEn` | const     | English `AiChat.*` bundle for this admin kit                             |
| `aiChatAdminTranslationsFr` | const     | French `AiChat.*` bundle for this admin kit                              |

## Injection

- **API client** — the host wraps `AIProvider` / `AIChatProvider` /
  `AIPromptsProvider` / `BlobStorageProvider`, each resolving the Axios client from
  a `GranitClientProvider` (via `@granit/react-api-client`). No client is baked in.
- **Routing** — `react-router-dom` (`useNavigate` / `useParams`) drives conversation
  selection (`/ai/chat/:id`) and the "new chat" navigation; a brand-new chat is
  promoted to its `:id` URL once the stream announces the conversation id.
- **Settings** — `@granit/react-settings` (`useSettings` / `useUpdateSetting`)
  persists the per-user chat preferences on the `user` scope.
- **i18n** — ships its `AiChat.*` strings (`aiChatAdminTranslationsEn/Fr`); the host
  registers them. The collision-safe `Admin` infix avoids clashing with the headless
  `aiChatTranslationsEn/Fr` from [`@granit/react-ai-chat`](../react-ai-chat) (the chat
  components' own default labels) when both bundles merge into one namespace.

## Caveats

- **Untrusted assistant output → clipboard.** `copyMessage` / `markdownToClipboard`
  treat the message as **untrusted** model output: the `html` branch is rendered
  with `marked` (GFM) and then run through **DOMPurify** before it reaches the
  clipboard, so a paste target can never receive live `<script>` / event-handler
  markup; `plain` strips to bare text (no tags, no attributes). The `html` flavour
  publishes a `ClipboardItem` with both `text/html` and a degraded `text/plain`
  fallback. Do not bypass these helpers when copying assistant content.
- **Report wire carries no message content.** `ChatMessageActions`' report dialog
  submits only a category + free-text reason via `onReport` — never the message
  body (per ADR-071). The `category` is constrained to `MESSAGE_REPORT_CATEGORIES`
  and the reason to `REPORT_REASON_MAX_LENGTH`, both from `@granit/ai-chat`.
- **Tooltips & toasts need app-level providers.** The action buttons rely on the
  app's root `TooltipProvider`, and copy/report feedback uses `@granit/react-ui`'s
  `toast` — both must already be mounted by the host shell.
- **Model picker metadata is a demo catalog.** `buildWorkspaceOptions` decorates
  workspace names by substring-matching a static brand/capability registry (model id
  → brand glyph, display name → label). It never breaks on unknown workspaces
  (generic mark, "Available" group), but a real deployment should derive capability
  glyphs from the backend's per-workspace model metadata rather than this catalog.

## Out of scope

- **HTTP transport, DTOs, streaming, query keys** — owned by
  [`@granit/ai-chat`](../ai-chat) (core, mirror of `Granit.AiChat`) and
  [`@granit/react-ai-chat`](../react-ai-chat) (hooks + provider + `useChatStream`).
  This package renders them; it issues no Axios calls of its own.
- **The framework chat components** — `ConversationThread`, `ChatComposer`,
  `ClarificationPrompt`, `SuggestedActions`, `ScrollToBottomButton` come from
  [`@granit/react-ai-chat`](../react-ai-chat); this kit only wires them together.
- **Web search execution** — the preferences page captures the per-user web-search
  *intent* (`Deny` / `Allow` / `AlwaysAsk`); enforcement is a backend concern.

## License

Apache-2.0
