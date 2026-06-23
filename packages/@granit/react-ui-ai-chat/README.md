# @granit/react-ui-ai-chat

Admin UI for the **AI Chat** module — the agentic chat workspace (a conversation
sidebar with pin / rename / delete, a streamed thread, the `/` `@` composer with
a branded model picker, and per-message copy / regenerate / report actions) plus
the per-user chat-preferences page.

The **visual** layer for AI Chat: it composes the headless
[`@granit/react-ai-chat`](../react-ai-chat) (provider + hooks + framework chat
components) with the foundation UI packages ([`@granit/react-ui`](../react-ui))
and the adjacent AI packages ([`@granit/react-ai`](../react-ai) for workspaces,
[`@granit/react-ai-prompts`](../react-ai-prompts) for the prompt picker,
[`@granit/react-ai-chat-blob-storage`](../react-ai-chat-blob-storage) for
attachments, [`@granit/react-settings`](../react-settings) for preferences).

## Usage

```tsx
import { ChatPage, ChatSettingsPage, aiChatAdminTranslationsEn } from '@granit/react-ui-ai-chat';

i18n.addResourceBundle('en', 'translation', aiChatAdminTranslationsEn, true, true);

// Mount under the AI / chat providers (which resolve the Axios client from a
// GranitClientProvider higher in the tree):
<Route path="/ai/chat" element={<ChatPage />} />;
<Route path="/ai/chat/:conversationId" element={<ChatPage />} />;
<Route path="/ai/chat/settings" element={<ChatSettingsPage />} />;
```

## Injection

- **API client** — the host wraps `AIProvider` / `AIChatProvider` /
  `AIPromptsProvider` / `BlobStorageProvider`, each resolving the Axios client
  from a `GranitClientProvider` (via `@granit/react-api-client`). No client is
  baked in.
- **Routing** — `react-router-dom` (`useNavigate` / `useParams`) drives the
  conversation selection (`/ai/chat/:id`) and the "new chat" navigation.
- **Settings** — `@granit/react-settings` (`useSettings` / `useUpdateSetting`)
  persists the per-user chat preferences on the `user` scope.
- **i18n** — ships its `AiChat.*` strings (`aiChatAdminTranslationsEn/Fr`); the
  host registers them. The collision-safe `Admin` infix avoids clashing with the
  headless `aiChatTranslationsEn/Fr` from `@granit/react-ai-chat` (the chat
  components' own default labels).
