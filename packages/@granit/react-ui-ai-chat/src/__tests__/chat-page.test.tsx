import { mockConversationMessages, mockConversationSummaries } from '@granit/react-ai-chat/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPage } from '../chat-page';

import { renderWithProviders } from './test-utils';

import type {
  ConversationSummaryResponse,
  MessageResponse,
  SendMessageRequest,
} from '@granit/ai-chat';
import type * as ReactRouterDom from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mutable per-test state for the mocked data layer. Each test seeds the hook
// returns it needs before rendering; `beforeEach` resets to a sensible default.
// ---------------------------------------------------------------------------

const navigate = vi.fn();
const useParamsMock = vi.fn<() => { conversationId?: string }>();

const setFavoriteAsync = vi.fn();
const renameAsync = vi.fn();
const removeAsync = vi.fn();
const reportAsync = vi.fn();

const streamSend = vi.fn();
const streamAbort = vi.fn();

interface StreamState {
  content: string;
  conversationId: string | null;
  suggestedActions: readonly { id: string; label: string; deepLink: string }[];
  clarification: { question: string; options: readonly { label: string; value: string }[] } | null;
  toolCalls: readonly unknown[];
  isThinking: boolean;
  metrics: unknown;
  isStreaming: boolean;
  error: Error | null;
  errorKind: string | null;
}

interface MessagesState {
  messages: readonly MessageResponse[];
  hasMoreOlder: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => void;
}

const state = vi.hoisted(() => ({
  conversations: [] as ConversationSummaryResponse[],
  stream: {} as StreamState,
  messages: {} as MessagesState,
}));

function defaultStream(): StreamState {
  return {
    content: '',
    conversationId: null,
    suggestedActions: [],
    clarification: null,
    toolCalls: [],
    isThinking: false,
    metrics: null,
    isStreaming: false,
    error: null,
    errorKind: null,
  };
}

function defaultMessages(): MessagesState {
  return {
    messages: [],
    hasMoreOlder: false,
    isLoadingOlder: false,
    loadOlder: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Module mocks. The framework chat surface (react-ai-chat) is stubbed: hooks
// return the mutable `state`, and the heavy components become inspectable stubs
// that expose their callback props as buttons so the page's wiring can be
// driven from the test.
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>('react-router-dom');
  return { ...actual, useNavigate: () => navigate, useParams: () => useParamsMock() };
});

vi.mock('@granit/react-ai', () => ({
  useAIWorkspaces: () => ({
    data: {
      workspaces: [
        { name: 'Auto', workspaceModelName: null, model: null },
        { name: 'support', workspaceModelName: 'GPT-4o', model: 'gpt-4o' },
      ],
    },
  }),
}));

vi.mock('@granit/react-ai-chat-blob-storage', () => ({
  CHAT_ATTACHMENT_ACCEPT: 'image/*',
  useAIChatBlobUpload: () => vi.fn(),
}));

vi.mock('@granit/react-ai-prompts', () => ({
  usePromptPicker: () => ({
    data: {
      categories: [
        {
          prompts: [
            {
              id: 'p1',
              name: 'Summarize',
              shortDescription: 'Summarize text',
              icon: 'sparkles',
              iconColor: 'blue',
            },
          ],
        },
      ],
    },
  }),
}));

vi.mock('@granit/react-ai-chat', () => ({
  useConversations: () => ({ data: state.conversations }),
  useSetConversationFavorite: () => ({ setFavoriteAsync }),
  useRenameConversation: () => ({ renameAsync }),
  useDeleteConversation: () => ({ removeAsync }),
  useReportMessage: () => ({ reportAsync }),
  useChatWorkspaces: () => ({ data: { workspaces: ['Auto', 'support'] } }),
  useConversationMessages: () => state.messages,
  useChatStream: () => ({
    ...state.stream,
    send: streamSend,
    abort: streamAbort,
  }),
  useStickToBottom: () => ({
    scrollRef: { current: null },
    contentRef: { current: null },
    isAtBottom: false,
    scrollToBottom: vi.fn(),
  }),
  useReverseInfiniteScroll: () => undefined,

  // Inspectable component stubs.
  ConversationThread: ({
    messages,
    streamingContent,
    isStreaming,
    onRetry,
    renderMessageActions,
  }: {
    messages: readonly MessageResponse[];
    streamingContent?: string;
    isStreaming: boolean;
    onRetry: () => void;
    renderMessageActions: (m: MessageResponse, i: number) => React.ReactNode;
  }) => (
    <div data-testid="thread">
      <span data-testid="msg-count">{messages.length}</span>
      {isStreaming ? <span data-testid="streaming">{streamingContent}</span> : null}
      {messages.map((m, i) => (
        <div key={m.id} data-testid={`row-${String(i)}`}>
          <span>{m.content}</span>
          {renderMessageActions(m, i)}
        </div>
      ))}
      <button type="button" onClick={onRetry}>
        retry
      </button>
    </div>
  ),
  ScrollToBottomButton: ({ visible, onClick }: { visible: boolean; onClick: () => void }) =>
    visible ? (
      <button type="button" onClick={onClick}>
        scroll-bottom
      </button>
    ) : null,
  SuggestedActions: ({
    actions,
    onSelect,
  }: {
    actions: readonly { id: string; label: string; deepLink: string }[];
    onSelect: (a: { deepLink: string }) => void;
  }) => (
    <div data-testid="suggested">
      {actions.map((a) => (
        <button key={a.id} type="button" onClick={() => onSelect(a)}>
          {a.label}
        </button>
      ))}
    </div>
  ),
  ClarificationPrompt: ({
    clarification,
    onChoose,
  }: {
    clarification: { question: string };
    onChoose: (answer: string) => void;
  }) => (
    <div data-testid="clarification">
      <span>{clarification.question}</span>
      <button type="button" onClick={() => onChoose('clarified answer')}>
        choose
      </button>
    </div>
  ),
  ChatComposer: ({
    workspace,
    onWorkspaceChange,
    isStreaming,
    onStop,
    onSubmit,
  }: {
    workspace?: string;
    onWorkspaceChange: (w: string) => void;
    isStreaming: boolean;
    onStop: () => void;
    onSubmit: (r: SendMessageRequest) => void;
  }) => (
    <div data-testid="composer">
      <span data-testid="composer-workspace">{workspace ?? 'none'}</span>
      <button type="button" onClick={() => onSubmit({ message: 'Hello there' })}>
        send
      </button>
      <button type="button" onClick={() => onWorkspaceChange('support')}>
        pick-workspace
      </button>
      {isStreaming ? (
        <button type="button" onClick={onStop}>
          stop
        </button>
      ) : null}
    </div>
  ),
}));

beforeEach(() => {
  state.conversations = structuredClone(mockConversationSummaries);
  state.stream = defaultStream();
  state.messages = defaultMessages();
  useParamsMock.mockReturnValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ChatPage — sidebar', () => {
  it('renders favourites and recent conversation groups', () => {
    renderWithProviders(<ChatPage />);

    // mockConversationSummaries has one favourite ("Daily brief") and one other.
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daily brief' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invoice questions' })).toBeInTheDocument();
  });

  it('omits the favourites header when nothing is pinned', () => {
    state.conversations = state.conversations.map((c) => ({ ...c, isFavorite: false }));
    renderWithProviders(<ChatPage />);

    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent')).not.toBeInTheDocument();
  });

  it('falls back to an empty list when the query has no data', () => {
    state.conversations = [];
    renderWithProviders(<ChatPage />);

    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
  });

  it('starts a fresh chat from the new-chat button', async () => {
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'Chat' }));
    expect(navigate).toHaveBeenCalledWith('/ai/chat');
  });

  it('navigates to a conversation when its row is selected', async () => {
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'Invoice questions' }));
    const first = mockConversationSummaries[0]!;
    expect(navigate).toHaveBeenCalledWith(`/ai/chat/${first.id}`);
  });

  it('toggles a conversation favourite from its kebab menu', async () => {
    setFavoriteAsync.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<ChatPage />);

    const row = screen.getByRole('button', { name: 'Invoice questions' }).closest('li')!;
    await user.click(within(row).getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Pin' }));

    const first = mockConversationSummaries[0]!;
    expect(setFavoriteAsync).toHaveBeenCalledWith({ id: first.id, isFavorite: true });
  });

  it('renames a conversation through the row dialog', async () => {
    renameAsync.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<ChatPage />);

    const row = screen.getByRole('button', { name: 'Invoice questions' }).closest('li')!;
    await user.click(within(row).getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const input = await screen.findByLabelText('Name');
    await user.clear(input);
    await user.type(input, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const first = mockConversationSummaries[0]!;
    expect(renameAsync).toHaveBeenCalledWith({ id: first.id, request: { title: 'Renamed' } });
  });

  it('deletes the active conversation and falls back to a fresh chat', async () => {
    removeAsync.mockResolvedValue(undefined);
    const first = mockConversationSummaries[0]!;
    useParamsMock.mockReturnValue({ conversationId: first.id });
    const { user } = renderWithProviders(<ChatPage />);

    const row = screen.getByRole('button', { name: 'Invoice questions' }).closest('li')!;
    await user.click(within(row).getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(removeAsync).toHaveBeenCalledWith(first.id));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/ai/chat'));
  });

  it('deletes a non-active conversation without redirecting', async () => {
    removeAsync.mockResolvedValue(undefined);
    const second = mockConversationSummaries[1]!; // "Daily brief", not selected
    const { user } = renderWithProviders(<ChatPage />);

    const row = screen.getByRole('button', { name: 'Daily brief' }).closest('li')!;
    await user.click(within(row).getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(removeAsync).toHaveBeenCalledWith(second.id));
    expect(navigate).not.toHaveBeenCalledWith('/ai/chat');
  });
});

describe('ChatPage — chat surface', () => {
  it('shows the persisted thread for the selected conversation', () => {
    const first = mockConversationSummaries[0]!;
    useParamsMock.mockReturnValue({ conversationId: first.id });
    state.messages = { ...defaultMessages(), messages: mockConversationMessages };
    renderWithProviders(<ChatPage />);

    expect(screen.getByTestId('msg-count')).toHaveTextContent(
      String(mockConversationMessages.length)
    );
    expect(screen.getByText(mockConversationMessages[0]!.content)).toBeInTheDocument();
  });

  it('seeds the workspace from the latest assistant message of a pre-feature chat', () => {
    const first = mockConversationSummaries[0]!; // workspaceKey null → not seeded yet
    useParamsMock.mockReturnValue({ conversationId: first.id });
    state.messages = {
      ...defaultMessages(),
      messages: [
        { ...mockConversationMessages[0]! },
        { ...mockConversationMessages[1]!, workspaceKey: 'support' },
      ],
    };
    renderWithProviders(<ChatPage />);

    expect(screen.getByTestId('composer-workspace')).toHaveTextContent('support');
  });

  it('uses the conversation initial workspace key when present', () => {
    state.conversations = state.conversations.map((c, i) =>
      i === 0 ? { ...c, workspaceKey: 'support' } : c
    );
    const first = mockConversationSummaries[0]!;
    useParamsMock.mockReturnValue({ conversationId: first.id });
    renderWithProviders(<ChatPage />);

    expect(screen.getByTestId('composer-workspace')).toHaveTextContent('support');
  });

  it('sends a message and shows the optimistic user bubble while streaming', async () => {
    state.stream = { ...defaultStream(), isStreaming: true };
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'send' }));

    expect(streamSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Hello there', conversationId: undefined })
    );
    // Optimistic bubble appended (no persisted messages → count becomes 1).
    await waitFor(() => expect(screen.getByTestId('msg-count')).toHaveTextContent('1'));
  });

  it('does not duplicate the optimistic bubble once the turn is persisted', async () => {
    state.stream = { ...defaultStream(), isStreaming: true };
    state.messages = {
      ...defaultMessages(),
      messages: [
        {
          ...mockConversationMessages[0]!,
          role: 'user',
          content: 'Hello there',
        },
      ],
    };
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'send' }));

    // Only the persisted message is shown — no second pending bubble.
    await waitFor(() => expect(screen.getByTestId('msg-count')).toHaveTextContent('1'));
  });

  it('renders streaming content while a turn is in flight', () => {
    state.stream = { ...defaultStream(), isStreaming: true, content: '   streaming text' };
    renderWithProviders(<ChatPage />);

    // Leading whitespace stripped by stripLeading.
    expect(screen.getByTestId('streaming')).toHaveTextContent('streaming text');
  });

  it('shows the thinking indicator while waiting for the first token', () => {
    state.stream = { ...defaultStream(), isStreaming: true, content: '', toolCalls: [] };
    renderWithProviders(<ChatPage />);

    expect(screen.getByText('Assistant is thinking…')).toBeInTheDocument();
  });

  it('exposes a stop button while streaming', async () => {
    state.stream = { ...defaultStream(), isStreaming: true };
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'stop' }));
    expect(streamAbort).toHaveBeenCalledTimes(1);
  });

  it('retries the last request verbatim after a failure', async () => {
    state.stream = { ...defaultStream(), errorKind: 'transport' };
    const { user } = renderWithProviders(<ChatPage />);

    // Seed a last request, then retry.
    await user.click(screen.getByRole('button', { name: 'send' }));
    streamSend.mockClear();
    await user.click(screen.getByRole('button', { name: 'retry' }));

    expect(streamSend).toHaveBeenCalledWith(expect.objectContaining({ message: 'Hello there' }));
  });

  it('navigates on a suggested action', async () => {
    state.stream = {
      ...defaultStream(),
      suggestedActions: [{ id: 'a1', label: 'Open invoice', deepLink: '/invoices/42' }],
    };
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'Open invoice' }));
    expect(navigate).toHaveBeenCalledWith('/invoices/42');
  });

  it('re-sends the chosen answer for a clarification', async () => {
    state.stream = {
      ...defaultStream(),
      clarification: { question: 'Which invoice?', options: [{ label: 'A', value: 'a' }] },
    };
    const { user } = renderWithProviders(<ChatPage />);

    await user.click(screen.getByRole('button', { name: 'choose' }));
    expect(streamSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'clarified answer' })
    );
  });

  it('changes the active workspace from the composer', async () => {
    const { user } = renderWithProviders(<ChatPage />);

    expect(screen.getByTestId('composer-workspace')).toHaveTextContent('none');
    await user.click(screen.getByRole('button', { name: 'pick-workspace' }));
    expect(screen.getByTestId('composer-workspace')).toHaveTextContent('support');
  });

  it('shows the older-messages loader while paginating up', () => {
    state.messages = { ...defaultMessages(), isLoadingOlder: true };
    const { container } = renderWithProviders(<ChatPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows the scroll-to-bottom button when not at the bottom', async () => {
    const { user } = renderWithProviders(<ChatPage />);

    const button = screen.getByRole('button', { name: 'scroll-bottom' });
    await user.click(button);
    // Stub onClick → scrollToBottom; no assertion needed beyond render coverage.
    expect(button).toBeInTheDocument();
  });

  it('promotes a brand-new chat to its URL once streaming finishes', async () => {
    state.stream = { ...defaultStream(), conversationId: 'new-id-123', isStreaming: false };
    renderWithProviders(<ChatPage />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/ai/chat/new-id-123', { replace: true })
    );
  });

  it('reports an assistant message through the message actions', async () => {
    reportAsync.mockResolvedValue(undefined);
    const first = mockConversationSummaries[0]!;
    useParamsMock.mockReturnValue({ conversationId: first.id });
    state.messages = { ...defaultMessages(), messages: mockConversationMessages };
    const { user } = renderWithProviders(<ChatPage />);

    // The assistant row (index 1) carries the Report action.
    const assistantRow = screen.getByTestId('row-1');
    await user.click(within(assistantRow).getByRole('button', { name: 'Report' }));
    await user.type(screen.getByLabelText('Reason'), 'Wrong');
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    await waitFor(() =>
      expect(reportAsync).toHaveBeenCalledWith(
        expect.objectContaining({ messageId: mockConversationMessages[1]!.id, reason: 'Wrong' })
      )
    );
  });

  it('regenerates an assistant answer by re-sending the preceding user turn', async () => {
    const first = mockConversationSummaries[0]!;
    useParamsMock.mockReturnValue({ conversationId: first.id });
    state.messages = { ...defaultMessages(), messages: mockConversationMessages };
    const { user } = renderWithProviders(<ChatPage />);

    const assistantRow = screen.getByTestId('row-1');
    await user.click(within(assistantRow).getByRole('button', { name: 'Regenerate response' }));

    expect(streamSend).toHaveBeenCalledWith(
      expect.objectContaining({ message: mockConversationMessages[0]!.content })
    );
  });
});
