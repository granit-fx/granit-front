import { mockProviderModels, mockProviders } from '@granit/react-ai/testing';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WorkspaceForm } from '../components/workspace-form';

import { renderWithProviders } from './test-utils';

import type { EditWorkspaceFormValues } from '../validation';

const providerState = vi.hoisted(() => ({ selected: undefined as string | undefined }));

vi.mock('@granit/ai', () => ({
  AI_WORKSPACE_LIMITS: {
    NAME_MAX_LENGTH: 128,
    NAME_PATTERN: /^[a-z0-9][a-z0-9-]*$/,
    MODEL_NAME_MAX_LENGTH: 64,
  },
}));

vi.mock('@granit/react-ai', () => ({
  useAIProviders: () => ({ data: mockProviders, isLoading: false }),
  useAIProviderModels: (provider?: string) => {
    providerState.selected = provider;
    return { data: provider ? (mockProviderModels[provider] ?? []) : [], isLoading: false };
  },
}));

const setupUser = () => userEvent.setup({ delay: null, pointerEventsCheck: 0 });

describe('WorkspaceForm (create)', () => {
  beforeEach(() => {
    providerState.selected = undefined;
  });

  it('renders the identity card only in create mode', () => {
    renderWithProviders(<WorkspaceForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('my-workspace')).toBeInTheDocument();
  });

  it('derives the key from the label, stripping disallowed characters', async () => {
    const user = setupUser();
    renderWithProviders(<WorkspaceForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('GPT-4o'), 'My Wörkspace 42');
    expect(screen.getByPlaceholderText('my-workspace')).toHaveValue('my-workspace-42');
  });

  it('stops deriving the key once it is edited manually', async () => {
    const user = setupUser();
    renderWithProviders(<WorkspaceForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const keyInput = screen.getByPlaceholderText('my-workspace');
    await user.type(keyInput, 'custom-key');
    await user.type(screen.getByPlaceholderText('GPT-4o'), 'Anything');
    expect(keyInput).toHaveValue('custom-key');
  });

  it('loads provider models after picking a provider and submits the form', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = setupUser();
    renderWithProviders(<WorkspaceForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('GPT-4o'), 'my workspace');

    // Provider select is the first combobox; model select the second.
    const combos = screen.getAllByRole('combobox');
    await user.click(combos[0]!);
    await user.click(await screen.findByRole('option', { name: 'OpenAI' }));

    await waitFor(() => expect(providerState.selected).toBe('OpenAI'));

    await user.click(screen.getAllByRole('combobox')[1]!);
    await user.click(await screen.findByRole('option', { name: 'GPT-4o' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const submitted = onSubmit.mock.calls[0]![0] as {
      key: string;
      provider: string;
      model: string;
    };
    expect(submitted.provider).toBe('OpenAI');
    expect(submitted.model).toBe('gpt-4o');
    expect(submitted.key).toBe('my-workspace');
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = setupUser();
    renderWithProviders(<WorkspaceForm mode="create" onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a busy label while pending', () => {
    renderWithProviders(
      <WorkspaceForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} isPending />
    );
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
  });
});

describe('WorkspaceForm (edit)', () => {
  const defaultValues: EditWorkspaceFormValues = {
    provider: 'OpenAI',
    model: 'gpt-4o',
    workspaceModelName: 'GPT-4o',
    systemPrompt: 'be helpful',
    temperature: 0.7,
    maxOutputTokens: 4096,
    activated: true,
  };

  beforeEach(() => {
    providerState.selected = undefined;
  });

  it('hides the identity card and shows the status switch in edit mode', () => {
    renderWithProviders(
      <WorkspaceForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByText('Identity')).not.toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('preloads the model capabilities from the default values', () => {
    renderWithProviders(
      <WorkspaceForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // gpt-4o has chat + vision capability badges rendered by WorkspaceCapabilities.
    expect(screen.getAllByText('Chat').length).toBeGreaterThan(0);
    expect(screen.getByText('Vision')).toBeInTheDocument();
  });

  it('submits the edit form with its current values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = setupUser();
    renderWithProviders(
      <WorkspaceForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const submitted = onSubmit.mock.calls[0]![0] as EditWorkspaceFormValues;
    expect(submitted.activated).toBe(false);
  });
});
