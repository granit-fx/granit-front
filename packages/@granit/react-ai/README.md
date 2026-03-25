# @granit/react-ai

React bindings for `@granit/ai` -- workspaces, chat completion, streaming, embeddings.

## Installation

```bash
pnpm add @granit/react-ai
```

## API

### Components

- `AIProvider` -- provides AI configuration to the component tree

### Hooks

- `useAIConfig()` -- access AI configuration from context
- `useAIWorkspaces()` -- list workspaces
- `useAIWorkspace(id)` -- fetch a single workspace
- `useCreateAIWorkspace()` -- create a workspace
- `useUpdateAIWorkspace()` -- update a workspace
- `useDeleteAIWorkspace()` -- delete a workspace
- `useAIChat()` -- synchronous chat completion
- `useAIChatStream()` -- streaming chat completion
- `useAIEmbeddings()` -- generate embeddings

## Usage

```tsx
import { AIProvider, useAIChatStream } from '@granit/react-ai';

function App() {
  return (
    <AIProvider client={axiosInstance} basePath="/api/ai">
      <ChatView />
    </AIProvider>
  );
}

function ChatView() {
  const { send, chunks, isStreaming } = useAIChatStream();

  return (
    <button onClick={() => send({ messages: [{ role: 'user', content: 'Hello' }] })}>
      {isStreaming ? 'Streaming...' : 'Send'}
    </button>
  );
}
```

## License

Apache-2.0
