import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AIWorkspaceCreatePage } from '../ai-workspace-create-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-ai', () => ({
  useCreateAIWorkspace: () => ({ createAsync: vi.fn(), isPending: false }),
  useAIProviders: () => ({ data: [], isLoading: false }),
  useAIProviderModels: () => ({ data: [], isLoading: false }),
}));

vi.mock('@granit/ai', () => ({
  AI_WORKSPACE_KINDS: ['chat', 'embedding'],
  AI_WORKSPACE_LIMITS: {
    NAME_MAX_LENGTH: 128,
    NAME_PATTERN: /^[a-z0-9][a-z0-9-]*$/,
    MODEL_NAME_MAX_LENGTH: 64,
  },
}));

describe('AIWorkspaceCreatePage', () => {
  it('should render page heading', () => {
    renderWithProviders(<AIWorkspaceCreatePage />);
    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
  });

  it('should render back link', () => {
    renderWithProviders(<AIWorkspaceCreatePage />);
    expect(screen.getByText('Back to workspaces')).toBeInTheDocument();
  });

  it('derives the key from the label, stripping disallowed characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AIWorkspaceCreatePage />);
    await user.type(screen.getByPlaceholderText('GPT-4o'), 'My Wörkspace 42');
    expect(screen.getByPlaceholderText('my-workspace')).toHaveValue('my-workspace-42');
  });

  it('stops deriving the key once it is edited manually', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AIWorkspaceCreatePage />);
    const keyInput = screen.getByPlaceholderText('my-workspace');
    await user.type(keyInput, 'custom-key');
    await user.type(screen.getByPlaceholderText('GPT-4o'), 'Anything');
    expect(keyInput).toHaveValue('custom-key');
  });
});
