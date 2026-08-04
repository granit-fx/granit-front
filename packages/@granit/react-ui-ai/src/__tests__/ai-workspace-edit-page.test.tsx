import { screen, waitFor } from '@testing-library/react';

import { AIWorkspaceEditPage } from '../components/ai-workspace-edit-page';

import { renderWithProviders } from './test-utils';

import type { EditWorkspaceFormValues } from '../validation';
import type { AIWorkspaceResponse } from '@granit/ai';

const baseWorkspace: AIWorkspaceResponse = {
  key: 'test-workspace',
  provider: 'OpenAI',
  model: 'gpt-4o',
  systemPrompt: 'sys',
  temperature: 0.7,
  maxOutputTokens: 4096,
  kind: 'Dynamic',
  activated: true,
  capabilities: null,
  displayName: null,
};

const state = vi.hoisted(() => ({
  workspace: null as AIWorkspaceResponse | null,
  isLoading: false,
  error: null as unknown,
  updateAsync: vi.fn<(name: string, input: unknown) => Promise<void>>(),
  canManage: true,
}));

const navigateMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const formMock = vi.hoisted(() => ({
  submitValues: {
    provider: 'OpenAI',
    model: 'gpt-4o',
    displayName: '',
    systemPrompt: '',
    temperature: '',
    maxOutputTokens: '',
    activated: true,
  } as EditWorkspaceFormValues,
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useParams: () => ({ name: 'test-workspace' }),
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@granit/react-ai', () => ({
  useAIWorkspace: () => ({
    data: state.workspace,
    isLoading: state.isLoading,
    error: state.error,
  }),
  useUpdateAIWorkspace: () => ({ updateAsync: state.updateAsync, isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => state.canManage, isLoading: false }),
}));

vi.mock('@granit/ai', () => ({
  AI_WORKSPACE_KINDS: { SYSTEM: 'System', DYNAMIC: 'Dynamic' },
  AIPermissions: { Workspaces: { Manage: 'AI.Workspaces.Manage' } },
}));

vi.mock('../components/workspace-form', () => ({
  WorkspaceForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (data: EditWorkspaceFormValues) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div>
      <span>stub-form</span>
      <button type="button" onClick={() => void onSubmit(formMock.submitValues)}>
        stub-submit
      </button>
      <button type="button" onClick={onCancel}>
        stub-cancel
      </button>
    </div>
  ),
}));

vi.mock('../components/workspace-detail', () => ({
  WorkspaceDetail: () => <div>stub-detail</div>,
}));

vi.mock('../components/workspace-test-panel', () => ({
  WorkspaceTestPanel: () => <div>stub-test-panel</div>,
}));

describe('AIWorkspaceEditPage', () => {
  beforeEach(() => {
    state.workspace = { ...baseWorkspace };
    state.isLoading = false;
    state.error = null;
    state.canManage = true;
    state.updateAsync.mockReset();
    state.updateAsync.mockResolvedValue(undefined);
    navigateMock.mockReset();
    toastMock.success.mockReset();
    formMock.submitValues = {
      provider: 'OpenAI',
      model: 'gpt-4o',
      displayName: '',
      systemPrompt: '',
      temperature: '',
      maxOutputTokens: '',
      activated: true,
    };
  });

  it('renders the workspace name and back link', () => {
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('test-workspace')).toBeInTheDocument();
    expect(screen.getByText('Back to workspaces')).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    state.isLoading = true;
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(document.querySelector('[data-slot="ai-workspace-edit-page"]')).not.toBeInTheDocument();
  });

  it('shows the not-found state on error', () => {
    state.error = new Error('nope');
    state.workspace = null;
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('Workspace not found')).toBeInTheDocument();
  });

  it('renders the editable form for a manageable dynamic workspace', () => {
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('stub-form')).toBeInTheDocument();
    expect(screen.getByText('stub-test-panel')).toBeInTheDocument();
  });

  it('renders the read-only detail for a system workspace', () => {
    state.workspace = { ...baseWorkspace, kind: 'System' };
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('stub-detail')).toBeInTheDocument();
    expect(screen.queryByText('stub-form')).not.toBeInTheDocument();
  });

  it('renders the read-only detail when the user cannot manage', () => {
    state.canManage = false;
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.getByText('stub-detail')).toBeInTheDocument();
  });

  it('hides the test panel when the workspace is not activated', () => {
    state.workspace = { ...baseWorkspace, activated: false };
    renderWithProviders(<AIWorkspaceEditPage />);
    expect(screen.queryByText('stub-test-panel')).not.toBeInTheDocument();
  });

  it('updates the workspace and shows a success toast on submit', async () => {
    formMock.submitValues = {
      provider: 'OpenAI',
      model: 'gpt-4o',
      displayName: 'GPT-4o',
      systemPrompt: 'sys',
      temperature: '0.5',
      maxOutputTokens: '2048',
      activated: false,
    };
    const { user } = renderWithProviders(<AIWorkspaceEditPage />);
    await user.click(screen.getByText('stub-submit'));

    await waitFor(() =>
      expect(state.updateAsync).toHaveBeenCalledWith('test-workspace', {
        provider: 'OpenAI',
        model: 'gpt-4o',
        displayName: 'GPT-4o',
        systemPrompt: 'sys',
        temperature: 0.5,
        maxOutputTokens: 2048,
        activated: false,
      })
    );
    expect(toastMock.success).toHaveBeenCalledWith('Workspace updated successfully');
  });

  it('coerces empty optional fields to null on submit', async () => {
    const { user } = renderWithProviders(<AIWorkspaceEditPage />);
    await user.click(screen.getByText('stub-submit'));

    await waitFor(() =>
      expect(state.updateAsync).toHaveBeenCalledWith('test-workspace', {
        provider: 'OpenAI',
        model: 'gpt-4o',
        displayName: null,
        systemPrompt: null,
        temperature: null,
        maxOutputTokens: null,
        activated: true,
      })
    );
  });

  it('does not toast when the update fails', async () => {
    state.updateAsync.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<AIWorkspaceEditPage />);
    await user.click(screen.getByText('stub-submit'));

    await waitFor(() => expect(state.updateAsync).toHaveBeenCalled());
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it('navigates back on cancel', async () => {
    const { user } = renderWithProviders(<AIWorkspaceEditPage />);
    await user.click(screen.getByText('stub-cancel'));
    expect(navigateMock).toHaveBeenCalledWith('/ai/workspaces');
  });
});
