import { screen } from '@testing-library/react';

import { AIWorkspaceEditPage } from '../ai-workspace-edit-page';

import { renderWithProviders } from './test-utils';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useParams: () => ({ name: 'test-workspace' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@granit/react-ai', () => ({
  useAIWorkspace: () => ({
    data: {
      name: 'test-workspace',
      kind: 'Dynamic',
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 4096,
      temperature: 0.7,
    },
    isLoading: false,
    error: null,
  }),
  useUpdateAIWorkspace: () => ({ updateAsync: vi.fn(), isPending: false }),
  useAIProviders: () => ({ data: [], isLoading: false }),
  useAIProviderModels: () => ({ data: [], isLoading: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

vi.mock('@granit/ai', () => ({
  AI_WORKSPACE_KINDS: { SYSTEM: 'System', DYNAMIC: 'Dynamic' },
  AI_WORKSPACE_LIMITS: {
    NAME_MAX_LENGTH: 128,
    NAME_PATTERN: /^[a-z0-9][a-z0-9-]*$/,
    MODEL_NAME_MAX_LENGTH: 64,
  },
  AIPermissions: {
    Workspaces: { Read: 'AI.Workspaces.Read', Manage: 'AI.Workspaces.Manage' },
    Usage: { Read: 'AI.Usage.Read' },
    Chat: { Execute: 'AI.Chat.Execute' },
    Embeddings: { Execute: 'AI.Embeddings.Execute' },
  },
}));

describe('AIWorkspaceEditPage', () => {
  it('should render workspace name', () => {
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('test-workspace')).toBeInTheDocument();
  });

  it('should render back link', () => {
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('Back to workspaces')).toBeInTheDocument();
  });
});
