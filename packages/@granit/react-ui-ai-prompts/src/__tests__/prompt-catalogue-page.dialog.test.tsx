import { mockPromptSummaries, mockUserPrompt } from '@granit/react-ai-prompts/testing';
import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { PromptCataloguePage } from '../prompt-catalogue-page';

import { renderWithProviders } from './test-utils';

import type { CreatePromptRequest } from '@granit/ai-prompts';

// ---------------------------------------------------------------------------
// Mock data — shared catalogue fixtures; the user-owned 'Daily brief' prompt
// drives the edit/customise/delete branches.
// ---------------------------------------------------------------------------

const mockPrompts = mockPromptSummaries;
const mockTargetPrompt = mockUserPrompt;
const mockEditingPrompt = mockUserPrompt;

// ---------------------------------------------------------------------------
// Mocks — richer catalogue/form stubs that expose every handler the page wires
// (onNew, onEdit, onDelete, onCustomise) plus a PromptForm driving onSubmit /
// onCancel so the create + edit submit branches are exercised.
// ---------------------------------------------------------------------------

const {
  mockUsePrompts,
  mockUsePrompt,
  mockHasPermission,
  mockCreateAsync,
  mockUpdateAsync,
  mockRemove,
  mockCustomise,
} = vi.hoisted(() => ({
  mockUsePrompts: vi.fn(),
  mockUsePrompt: vi.fn(),
  mockHasPermission: vi.fn(),
  mockCreateAsync: vi.fn(),
  mockUpdateAsync: vi.fn(),
  mockRemove: vi.fn(),
  mockCustomise: vi.fn(),
}));

vi.mock('@granit/react-ai-prompts', () => ({
  usePrompts: mockUsePrompts,
  usePrompt: mockUsePrompt,
  useCreatePrompt: () => ({ createAsync: mockCreateAsync, isPending: false }),
  useUpdatePrompt: () => ({ updateAsync: mockUpdateAsync, isPending: false }),
  useDeletePrompt: () => ({ remove: mockRemove }),
  useCustomisePrompt: () => ({ customise: mockCustomise }),
  PromptCatalogue: ({
    prompts,
    canManage,
    canDelete,
    onNew,
    onEdit,
    onDelete,
    onCustomise,
  }: {
    prompts: readonly { id: string; name: string }[];
    canManage: boolean;
    canDelete: boolean;
    onNew: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onCustomise: (id: string) => void;
  }) => (
    <div data-slot="prompt-catalogue-stub">
      {canManage && (
        <button type="button" onClick={onNew}>
          New prompt
        </button>
      )}
      <ul>
        {prompts.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <button type="button" aria-label={`edit ${p.name}`} onClick={() => onEdit(p.id)}>
              Edit
            </button>
            <button
              type="button"
              aria-label={`customise ${p.name}`}
              onClick={() => onCustomise(p.id)}
            >
              Customise
            </button>
            {canDelete && (
              <button type="button" aria-label={`delete ${p.name}`} onClick={() => onDelete(p.id)}>
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  ),
  PromptForm: ({
    initial,
    submitting,
    onSubmit,
    onCancel,
  }: {
    initial?: { name: string };
    submitting: boolean;
    onSubmit: (request: CreatePromptRequest) => void;
    onCancel: () => void;
  }) => (
    <div data-slot="prompt-form-stub">
      <span>initial: {initial ? initial.name : 'none'}</span>
      <span>submitting: {String(submitting)}</span>
      <button
        type="button"
        onClick={() =>
          onSubmit({
            name: 'New name',
            shortDescription: 'desc',
            content: 'content',
            icon: null,
            iconColor: null,
            categoryIds: [],
          } as unknown as CreatePromptRequest)
        }
      >
        Submit form
      </button>
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
    </div>
  ),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUsePrompts.mockReturnValue({ data: mockPrompts });
  mockUsePrompt.mockReturnValue({ data: null });
  mockHasPermission.mockReturnValue(true);
  mockCreateAsync.mockResolvedValue(undefined);
  mockUpdateAsync.mockResolvedValue(undefined);
});

describe('PromptCataloguePage dialogs', () => {
  it('should open the create dialog and create a prompt on submit', async () => {
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: 'New prompt' }));

    // Form rendered with no initial data (create mode).
    await waitFor(() => {
      expect(screen.getByText('initial: none')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Submit form' }));

    await waitFor(() => {
      expect(mockCreateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateAsync).not.toHaveBeenCalled();
    // Dialog closes after a successful create.
    await waitFor(() => {
      expect(screen.queryByText('initial: none')).not.toBeInTheDocument();
    });
  });

  it('should show a loading state in the edit dialog while the prompt is fetching', async () => {
    mockUsePrompt.mockReturnValue({ data: null });
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: `edit ${mockTargetPrompt.name}` }));

    await waitFor(() => {
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
    // The form is not rendered until the prompt has loaded.
    expect(screen.queryByText(/^initial:/)).not.toBeInTheDocument();
  });

  it('should render the edit form once loaded and update on submit', async () => {
    mockUsePrompt.mockReturnValue({ data: mockEditingPrompt });
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: `edit ${mockTargetPrompt.name}` }));

    await waitFor(() => {
      expect(screen.getByText(`initial: ${mockEditingPrompt.name}`)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Submit form' }));

    await waitFor(() => {
      expect(mockUpdateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockEditingPrompt.id })
    );
    expect(mockCreateAsync).not.toHaveBeenCalled();
  });

  it('should close the dialog when the form is cancelled', async () => {
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: 'New prompt' }));
    await waitFor(() => {
      expect(screen.getByText('initial: none')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Cancel form' }));

    await waitFor(() => {
      expect(screen.queryByText('initial: none')).not.toBeInTheDocument();
    });
    expect(mockCreateAsync).not.toHaveBeenCalled();
  });

  it('should customise a system prompt', async () => {
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: `customise ${mockTargetPrompt.name}` }));

    expect(mockCustomise).toHaveBeenCalledWith(mockTargetPrompt.id);
  });

  it('should cancel the delete confirmation without removing', async () => {
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: `delete ${mockTargetPrompt.name}` }));
    await waitFor(() => {
      expect(screen.getByText('Delete this prompt?')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Delete this prompt?')).not.toBeInTheDocument();
    });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('should default to an empty list when usePrompts returns no data', () => {
    mockUsePrompts.mockReturnValue({ data: undefined });
    renderWithProviders(<PromptCataloguePage />);
    expect(document.querySelector('[data-slot="prompt-catalogue-stub"]')).toBeInTheDocument();
    expect(screen.queryByText(mockTargetPrompt.name)).not.toBeInTheDocument();
  });
});
