import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WorkspaceCustomizationTab } from '../components/workspace-customization-tab';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseWorkspaces, mockUseWorkspaceCustomization, mockPutMutate, mockToastSuccess } =
  vi.hoisted(() => ({
    mockUseWorkspaces: vi.fn(),
    mockUseWorkspaceCustomization: vi.fn(),
    mockPutMutate: vi.fn(),
    mockToastSuccess: vi.fn(),
  }));

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => mockUseWorkspaces(),
}));

vi.mock('@granit/react-entities-customization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceCustomization: (args: unknown) => mockUseWorkspaceCustomization(args),
  usePutWorkspaceCustomization: () => ({ mutate: mockPutMutate, isPending: false }),
  WorkspaceLayoutEditor: ({
    fields,
    onChange,
  }: {
    readonly fields: ReadonlyArray<{ readonly name: string }>;
    readonly onChange: (deltas: readonly unknown[]) => void;
  }) => (
    <div data-slot="workspace-layout-editor">
      <span>ws-fields:{fields.length}</span>
      <button type="button" onClick={() => onChange([{ $type: 'hide', fieldName: 'x' }])}>
        ws-hide
      </button>
    </div>
  ),
}));

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

const setupUser = () => userEvent.setup({ delay: null, pointerEventsCheck: 0 });

const TREE = {
  data: {
    workspaces: [
      {
        name: 'sales',
        displayKey: null,
        sections: [
          {
            key: 'main',
            displayKey: 'Main',
            items: [
              { kind: 'entity', entityName: 'Customer', displayKey: 'Customers' },
              {
                kind: 'dashboard',
                entityName: null,
                dashboardName: 'KPIs',
                linkUrl: null,
                subWorkspaceName: null,
                displayKey: null,
              },
            ],
          },
        ],
      },
      { name: 'empty', displayKey: 'Empty WS', sections: [] },
    ],
  },
  isLoading: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkspaceCustomizationTab', () => {
  beforeEach(() => {
    mockUseWorkspaces.mockReturnValue(TREE);
    mockUseWorkspaceCustomization.mockReturnValue({ data: undefined, isLoading: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the title and a pick-to-start prompt before a workspace is chosen', () => {
    renderWithProviders(<WorkspaceCustomizationTab />);
    expect(screen.getByText('Workspace layout')).toBeInTheDocument();
    expect(screen.getByText('Pick a workspace to start editing.')).toBeInTheDocument();
  });

  it('shows a spinner while the workspace tree is loading', () => {
    mockUseWorkspaces.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<WorkspaceCustomizationTab />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('disables Save and Reset when no workspace is selected', () => {
    renderWithProviders(<WorkspaceCustomizationTab />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('renders the editor with flattened items once a workspace is selected', async () => {
    const user = setupUser();
    renderWithProviders(<WorkspaceCustomizationTab />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'sales' }));
    expect(await screen.findByText('ws-fields:2')).toBeInTheDocument();
  });

  it('shows the spinner while customization is loading after selection', async () => {
    mockUseWorkspaceCustomization.mockReturnValue({ data: undefined, isLoading: true });
    const user = setupUser();
    renderWithProviders(<WorkspaceCustomizationTab />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'sales' }));
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeTruthy());
  });

  it('shows the no-items message for a workspace with no editable items', async () => {
    const user = setupUser();
    renderWithProviders(<WorkspaceCustomizationTab />);
    await user.click(screen.getByRole('combobox'));
    // displayKey 'Empty WS' is an unknown i18n key, so it resolves to the
    // defaultValue (the workspace name 'empty').
    await user.click(await screen.findByRole('option', { name: 'empty' }));
    expect(await screen.findByText('This workspace has no editable items.')).toBeInTheDocument();
  });

  it('saves the draft and toasts success', async () => {
    mockPutMutate.mockImplementation((_args, opts) => opts?.onSuccess?.());
    const user = setupUser();
    renderWithProviders(<WorkspaceCustomizationTab />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'sales' }));
    await user.click(await screen.findByText('ws-hide'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockPutMutate).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceName: 'sales' }),
      expect.any(Object)
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Workspace layout saved');
  });

  it('resets the draft to server deltas', async () => {
    mockUseWorkspaceCustomization.mockReturnValue({
      data: { deltas: [{ $type: 'hide', fieldName: 'x' }] },
      isLoading: false,
    });
    const user = setupUser();
    renderWithProviders(<WorkspaceCustomizationTab />);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'sales' }));
    await user.click(await screen.findByText('ws-hide'));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('ws-fields:2')).toBeInTheDocument();
  });
});
