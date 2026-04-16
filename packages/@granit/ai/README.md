# @granit/ai

AI workspace management, chat completion (sync + streaming), and embedding generation. Mirrors `Granit.AI` .NET contract.

## Installation

```bash
pnpm add @granit/ai
```

## API

### Types

- `AIWorkspaceResponse`, `AIWorkspaceListResponse`, `AIWorkspaceCreateRequest`, `AIWorkspaceUpdateRequest`, `AIWorkspaceKind` -- workspaces
- `AIChatRequest`, `AIChatResponse`, `AIChatMessageRequest`, `AIChatMessageRole`, `AIChatStreamChunk`, `AIChatUsageResponse` -- chat
- `AIEmbeddingRequest`, `AIEmbeddingResponse`, `AIEmbeddingDataResponse`, `AIUsageRecord` -- embeddings

### Constants

- `AI_WORKSPACE_KINDS` -- workspace kind values
- `AI_PERMISSIONS` -- permission constants
- `AI_STREAM_DONE_MARKER` -- SSE stream terminator

### Functions

- `listAIWorkspaces(...)`, `getAIWorkspace(...)`, `createAIWorkspace(...)`, `updateAIWorkspace(...)`, `deleteAIWorkspace(...)` -- workspace CRUD
- `chatComplete(...)`, `chatStream(...)`, `buildChatStreamUrl(...)` -- chat completion
- `generateEmbeddings(...)` -- embedding generation

## Usage

```ts
import { chatComplete, listAIWorkspaces } from '@granit/ai';
import type { AIChatRequest } from '@granit/ai';

const workspaces = await listAIWorkspaces(client, basePath);

const request: AIChatRequest = {
  workspaceId: '...',
  messages: [{ role: 'user', content: 'Hello' }],
};
const response = await chatComplete(client, basePath, request);
```

## License

Apache-2.0
