# @granit/ai

AI workspace management, chat completion (sync + streaming), and embedding generation. Mirrors `Granit.AI` .NET contract.

## Installation

```bash
pnpm add @granit/ai
```

## API

### Types

- `AIWorkspaceResponse`, `AIWorkspaceListResponse`, `AIWorkspaceCreateRequest`, `AIWorkspaceUpdateRequest`, `AIWorkspaceKind` -- workspaces
- `AIChatRequest`, `AIChatResponse`, `AIChatMessageRequest`, `AIChatMessageRole`, `AIChatStreamChunk`, `AIChatStreamUsage`, `AIChatUsageResponse`, `ChatStreamEvent` -- chat
- `AIEmbeddingRequest`, `AIEmbeddingResponse`, `AIEmbeddingDataResponse`, `AIEmbeddingUsageResponse` -- embeddings
- `AIProviderResponse`, `AIProviderModelResponse`, `AIModelCapabilities` -- provider/model discovery
- `AIUsageRecord`, `AIUsageRecordId` -- usage records (queried via `@granit/react-ai/usage`)

### Constants

- `AI_WORKSPACE_KINDS` -- workspace kind values
- `AI_CAPABILITY_EXTENSIONS` -- well-known capability extension identifiers
- `AI_STREAM_DONE_MARKER` -- SSE stream terminator

### Permissions

- `AIPermissions` -- permission constants (`AIPermissions.Workspaces.Manage`, `AIPermissions.Chat.Execute`, ...)

### Functions

- `listAIWorkspaces(...)`, `getAIWorkspace(...)`, `createAIWorkspace(...)`, `updateAIWorkspace(...)`, `deleteAIWorkspace(...)` -- workspace CRUD
- `listAIProviders(...)`, `listAIProviderModels(...)` -- provider/model discovery
- `chatComplete(...)`, `chatStream(...)` -- chat completion (sync + SSE)
- `generateEmbeddings(...)` -- embedding generation

## Usage

```ts
import { chatComplete, listAIWorkspaces } from '@granit/ai';
import type { AIChatRequest } from '@granit/ai';

const workspaces = await listAIWorkspaces(client, basePath);

const request: AIChatRequest = {
  messages: [{ role: 'user', content: 'Hello' }],
};
const response = await chatComplete(client, basePath, 'default', request);
```

## License

Apache-2.0
