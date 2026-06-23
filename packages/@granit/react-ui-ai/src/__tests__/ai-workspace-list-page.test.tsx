import { screen } from '@testing-library/react';

import { AIWorkspaceListPage } from '../ai-workspace-list-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-ai', () => ({
  useAIWorkspaces: () => ({ data: [], isLoading: false }),
  useDeleteAIWorkspace: () => ({ removeAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

vi.mock('@granit/ai', () => ({
  AIPermissions: {
    Workspaces: { Read: 'AI.Workspaces.Read', Manage: 'AI.Workspaces.Manage' },
    Usage: { Read: 'AI.Usage.Read' },
    Chat: { Execute: 'AI.Chat.Execute' },
    Embeddings: { Execute: 'AI.Embeddings.Execute' },
  },
  AI_WORKSPACE_KINDS: {},
}));

describe('AIWorkspaceListPage', () => {
  it('should render the page title', () => {
    renderWithProviders(<AIWorkspaceListPage />);
    expect(screen.getByText('AI Workspaces')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<AIWorkspaceListPage />);
    expect(document.querySelector('[data-slot="ai-workspace-list-page"]')).toBeInTheDocument();
  });

  it('should render create button', () => {
    renderWithProviders(<AIWorkspaceListPage />);
    expect(screen.getByRole('button', { name: /new workspace/i })).toBeInTheDocument();
  });
});
