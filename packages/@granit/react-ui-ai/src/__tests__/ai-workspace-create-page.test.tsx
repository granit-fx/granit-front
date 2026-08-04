import { screen, waitFor } from '@testing-library/react';

import { AIWorkspaceCreatePage } from '../components/ai-workspace-create-page';

import { renderWithProviders } from './test-utils';

import type { CreateWorkspaceFormValues } from '../validation';

const createMock = vi.hoisted(() => vi.fn<(input: unknown) => Promise<{ name: string }>>());
const navigateMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const formMock = vi.hoisted(() => ({
  submitValues: {
    key: 'my-workspace',
    provider: 'OpenAI',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    systemPrompt: 'be helpful',
    temperature: '0.7',
    maxOutputTokens: '4096',
  } as CreateWorkspaceFormValues,
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@granit/react-ai', () => ({
  useCreateAIWorkspace: () => ({ createAsync: createMock, isPending: false }),
}));

// Replace the heavy form with a stub that drives the page's submit/cancel paths.
vi.mock('../components/workspace-form', () => ({
  WorkspaceForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (data: CreateWorkspaceFormValues) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => void onSubmit(formMock.submitValues)}>
        stub-submit
      </button>
      <button type="button" onClick={onCancel}>
        stub-cancel
      </button>
    </div>
  ),
}));

describe('AIWorkspaceCreatePage', () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({ key: 'my-workspace' });
    navigateMock.mockReset();
    toastMock.success.mockReset();
    formMock.submitValues = {
      key: 'my-workspace',
      provider: 'OpenAI',
      model: 'gpt-4o',
      displayName: 'GPT-4o',
      systemPrompt: 'be helpful',
      temperature: '0.7',
      maxOutputTokens: '4096',
    };
  });

  it('renders the heading and back link', () => {
    renderWithProviders(<AIWorkspaceCreatePage />);
    expect(screen.getByText('Create Workspace')).toBeInTheDocument();
    expect(screen.getByText('Back to workspaces')).toBeInTheDocument();
  });

  it('creates the workspace and navigates to its detail page on success', async () => {
    const { user } = renderWithProviders(<AIWorkspaceCreatePage />);
    await user.click(screen.getByText('stub-submit'));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        key: 'my-workspace',
        provider: 'OpenAI',
        model: 'gpt-4o',
        displayName: 'GPT-4o',
        systemPrompt: 'be helpful',
        temperature: 0.7,
        maxOutputTokens: 4096,
      })
    );
    expect(toastMock.success).toHaveBeenCalledWith('Workspace created successfully');
    expect(navigateMock).toHaveBeenCalledWith('/ai/workspaces/my-workspace');
  });

  it('coerces empty optional fields to null', async () => {
    formMock.submitValues = {
      key: 'bare',
      provider: 'OpenAI',
      model: 'gpt-4o',
      displayName: '',
      systemPrompt: '',
      temperature: '',
      maxOutputTokens: '',
    };
    const { user } = renderWithProviders(<AIWorkspaceCreatePage />);
    await user.click(screen.getByText('stub-submit'));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith({
        key: 'bare',
        provider: 'OpenAI',
        model: 'gpt-4o',
        displayName: null,
        systemPrompt: null,
        temperature: null,
        maxOutputTokens: null,
      })
    );
  });

  it('does not navigate or toast when creation fails', async () => {
    createMock.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<AIWorkspaceCreatePage />);
    await user.click(screen.getByText('stub-submit'));

    await waitFor(() => expect(createMock).toHaveBeenCalled());
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('navigates back on cancel', async () => {
    const { user } = renderWithProviders(<AIWorkspaceCreatePage />);
    await user.click(screen.getByText('stub-cancel'));
    expect(navigateMock).toHaveBeenCalledWith('/ai/workspaces');
  });
});
