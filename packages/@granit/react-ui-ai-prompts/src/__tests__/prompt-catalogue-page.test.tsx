import {
  mockPromptSummaries,
  mockSystemPrompt,
  mockUserPrompt,
} from '@granit/react-ai-prompts/testing';
import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { PromptCataloguePage } from '../components/prompt-catalogue-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mock data — shared catalogue fixtures (system 'Summarize' + user 'Daily brief')
// ---------------------------------------------------------------------------

const mockPrompts = mockPromptSummaries;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUsePrompts, mockHasPermission } = vi.hoisted(() => ({
  mockUsePrompts: vi.fn(),
  mockHasPermission: vi.fn(),
}));

const mockRemove = vi.fn();

vi.mock('@granit/react-ai-prompts', () => ({
  usePrompts: mockUsePrompts,
  usePrompt: () => ({ data: null }),
  useCreatePrompt: () => ({ createAsync: vi.fn(), isPending: false }),
  useUpdatePrompt: () => ({ updateAsync: vi.fn(), isPending: false }),
  useDeletePrompt: () => ({ remove: mockRemove }),
  useCustomisePrompt: () => ({ customise: vi.fn() }),
}));

// Stub the sibling styled components so the page test exercises only the page's
// own wiring (the components have their own focused tests).
vi.mock('../components/prompt-catalogue', () => ({
  PromptCatalogue: ({
    prompts,
    canManage,
    canDelete,
    onNew,
    onDelete,
  }: {
    prompts: readonly { id: string; name: string }[];
    canManage: boolean;
    canDelete: boolean;
    onNew: () => void;
    onDelete: (id: string) => void;
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
}));

vi.mock('../components/prompt-form', () => ({
  PromptForm: () => <div data-slot="prompt-form-stub" />,
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUsePrompts.mockReturnValue({ data: mockPrompts });
  mockHasPermission.mockReturnValue(true);
});

describe('PromptCataloguePage', () => {
  it('should render the catalogue title and description', () => {
    renderWithProviders(<PromptCataloguePage />);
    expect(screen.getByText('Prompt catalogue')).toBeInTheDocument();
    expect(screen.getByText(/Reusable/)).toBeInTheDocument();
  });

  it('should expose the page data-slot', () => {
    renderWithProviders(<PromptCataloguePage />);
    expect(document.querySelector('[data-slot="ai-prompts-page"]')).toBeInTheDocument();
  });

  it('should list the prompts from usePrompts', () => {
    renderWithProviders(<PromptCataloguePage />);
    expect(screen.getByText(mockSystemPrompt.name)).toBeInTheDocument();
    expect(screen.getByText(mockUserPrompt.name)).toBeInTheDocument();
  });

  it('should show the New prompt affordance when the user can manage', () => {
    renderWithProviders(<PromptCataloguePage />);
    expect(screen.getByRole('button', { name: 'New prompt' })).toBeInTheDocument();
  });

  it('should hide management affordances when the user lacks permission', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<PromptCataloguePage />);
    expect(screen.queryByRole('button', { name: 'New prompt' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should open the delete confirmation dialog and delete on confirm', async () => {
    const { user } = renderWithProviders(<PromptCataloguePage />);

    await user.click(screen.getByRole('button', { name: `delete ${mockSystemPrompt.name}` }));

    await waitFor(() => {
      expect(screen.getByText('Delete this prompt?')).toBeInTheDocument();
    });
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockRemove).toHaveBeenCalledWith(mockSystemPrompt.id);
  });

  it('should render an empty catalogue when there are no prompts', () => {
    mockUsePrompts.mockReturnValue({ data: [] });
    renderWithProviders(<PromptCataloguePage />);
    expect(screen.queryByText(mockSystemPrompt.name)).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="prompt-catalogue-stub"]')).toBeInTheDocument();
  });
});
