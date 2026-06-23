import { screen } from '@testing-library/react';

import { WorkspaceTestPanel } from '../components/workspace-test-panel';

import { renderWithProviders } from './test-utils';

import type { AIModelCapabilities, AIWorkspaceResponse } from '@granit/ai';

const chatMock = vi.hoisted(() => ({
  content: '',
  isStreaming: false,
  error: null as { message: string } | null,
  send: vi.fn(),
  abort: vi.fn(),
}));

const embedMock = vi.hoisted(() => ({
  generateAsync: vi.fn(),
  data: null as { embeddings: { vector: number[] }[] } | null,
  isPending: false,
  error: null as { message: string } | null,
}));

const permMock = vi.hoisted(() => ({ has: true }));

vi.mock('@granit/react-ai', () => ({
  useAIChatStream: () => chatMock,
  useAIEmbeddings: () => embedMock,
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => permMock.has, isLoading: false }),
}));

vi.mock('@granit/ai', () => ({
  AIPermissions: {
    Chat: { Execute: 'AI.Chat.Execute' },
    Embeddings: { Execute: 'AI.Embeddings.Execute' },
  },
}));

const baseCaps: AIModelCapabilities = {
  chat: true,
  embeddings: true,
  vision: false,
  imageGeneration: false,
  audio: false,
  toolUse: false,
  streaming: true,
  structuredOutput: false,
  extensions: [],
};

function makeWorkspace(caps: Partial<AIModelCapabilities>): AIWorkspaceResponse {
  return {
    key: 'test-ws',
    provider: 'OpenAI',
    model: 'gpt-4o',
    systemPrompt: null,
    temperature: 0.7,
    maxOutputTokens: 4096,
    kind: 'Dynamic',
    activated: true,
    capabilities: { ...baseCaps, ...caps },
    displayName: null,
  };
}

describe('WorkspaceTestPanel', () => {
  beforeEach(() => {
    chatMock.content = '';
    chatMock.isStreaming = false;
    chatMock.error = null;
    chatMock.send.mockClear();
    chatMock.abort.mockClear();
    embedMock.generateAsync.mockClear();
    embedMock.data = null;
    embedMock.isPending = false;
    embedMock.error = null;
    permMock.has = true;
  });

  it('renders nothing when chat and embeddings are both unavailable', () => {
    const { container } = renderWithProviders(
      <WorkspaceTestPanel workspace={makeWorkspace({ chat: false, embeddings: false })} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when capabilities are present but permissions are missing', () => {
    permMock.has = false;
    const { container } = renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders both tabs when chat and embeddings are available', () => {
    renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Embeddings' })).toBeInTheDocument();
  });

  it('sends a chat message with the trimmed input', async () => {
    const { user } = renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    await user.type(screen.getByPlaceholderText(/Type a message/), '  hello  ');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(chatMock.send).toHaveBeenCalledWith('test-ws', {
      messages: [{ role: 'user', content: 'hello' }],
    });
  });

  it('sends a chat message on Ctrl+Enter', async () => {
    const { user } = renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    const textarea = screen.getByPlaceholderText(/Type a message/);
    await user.type(textarea, 'ping');
    await user.type(textarea, '{Control>}{Enter}{/Control}');
    expect(chatMock.send).toHaveBeenCalled();
  });

  it('clears the input and aborts on Clear', async () => {
    const { user } = renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    const textarea = screen.getByPlaceholderText(/Type a message/);
    await user.type(textarea, 'draft');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(chatMock.abort).toHaveBeenCalled();
    expect(textarea).toHaveValue('');
  });

  it('shows a Stop button and the streamed content while streaming', () => {
    chatMock.isStreaming = true;
    chatMock.content = 'partial answer';
    renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    expect(screen.getByText('partial answer')).toBeInTheDocument();
  });

  it('renders the chat error message', () => {
    chatMock.error = { message: 'chat failed' };
    renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({})} />);
    expect(screen.getByText('chat failed')).toBeInTheDocument();
  });

  it('defaults to the embeddings tab when chat is unavailable', () => {
    renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({ chat: false })} />);
    expect(screen.getByPlaceholderText('Enter text to embed…')).toBeVisible();
  });

  it('generates embeddings for the trimmed input', async () => {
    const { user } = renderWithProviders(
      <WorkspaceTestPanel workspace={makeWorkspace({ chat: false })} />
    );
    await user.type(screen.getByPlaceholderText('Enter text to embed…'), '  vec  ');
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(embedMock.generateAsync).toHaveBeenCalledWith('test-ws', { inputs: ['vec'] });
  });

  it('renders the embedding result and the error', () => {
    embedMock.data = { embeddings: [{ vector: Array.from({ length: 30 }, (_, i) => i) }] };
    embedMock.error = { message: 'embed failed' };
    renderWithProviders(<WorkspaceTestPanel workspace={makeWorkspace({ chat: false })} />);
    expect(screen.getByText('Embedding vector (30 dimensions)')).toBeInTheDocument();
    expect(screen.getByText('embed failed')).toBeInTheDocument();
  });
});
