import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntityCustomizationSection } from '../components/entity-customization-section';

import { renderWithProviders } from './test-utils';

import type { SchemaField } from '@granit/react-entities-customization';

// ---------------------------------------------------------------------------
// Mocks — the section renders FormLayoutEditor (stubbed) and, on the
// Workspaces sub-tab, the real WorkspaceCustomizationTab whose data hooks are
// stubbed too.
// ---------------------------------------------------------------------------

const { mockOnChange, mockUseWorkspaces, mockUseWorkspaceCustomization } = vi.hoisted(() => ({
  mockOnChange: vi.fn(),
  mockUseWorkspaces: vi.fn(() => ({ data: { workspaces: [] }, isLoading: false })),
  mockUseWorkspaceCustomization: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

vi.mock('@granit/react-entities-customization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useWorkspaceCustomization: () => mockUseWorkspaceCustomization(),
  usePutWorkspaceCustomization: () => ({ mutate: vi.fn(), isPending: false }),
  FormLayoutEditor: ({ fields }: { readonly fields: readonly SchemaField[] }) => (
    <div data-slot="form-layout-editor">fields:{fields.length}</div>
  ),
  WorkspaceLayoutEditor: () => <div data-slot="workspace-layout-editor" />,
}));

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => mockUseWorkspaces(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const setupUser = () => userEvent.setup({ delay: null, pointerEventsCheck: 0 });

const FIELDS: readonly SchemaField[] = [
  { name: 'firstName', label: 'First name', defaultGroup: 'general' },
  { name: 'lastName', label: 'Last name', defaultGroup: 'general' },
];

function baseProps(
  overrides: Partial<React.ComponentProps<typeof EntityCustomizationSection>> = {}
) {
  return {
    entityName: 'Customer',
    isManifestLoading: false,
    isCustomizationLoading: false,
    fields: FIELDS,
    draftDeltas: [],
    setDraftDeltas: mockOnChange,
    groups: [{ key: 'general', label: 'General' }],
    onSave: vi.fn(),
    onReset: vi.fn(),
    isSavePending: false,
    onInspectField: vi.fn(),
    ...overrides,
  } satisfies React.ComponentProps<typeof EntityCustomizationSection>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EntityCustomizationSection', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the empty-state card when no entity is selected', () => {
    renderWithProviders(<EntityCustomizationSection {...baseProps({ entityName: '' })} />);
    expect(screen.getByText('Pick an entity to start editing.')).toBeInTheDocument();
  });

  it('renders a spinner while the manifest is loading', () => {
    renderWithProviders(<EntityCustomizationSection {...baseProps({ isManifestLoading: true })} />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders a spinner while the customization is loading', () => {
    renderWithProviders(
      <EntityCustomizationSection {...baseProps({ isCustomizationLoading: true })} />
    );
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders the Forms tab with the editor and inspect buttons', () => {
    renderWithProviders(<EntityCustomizationSection {...baseProps()} />);
    expect(screen.getByText('Form layout')).toBeInTheDocument();
    expect(screen.getByText('fields:2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inspect firstName' })).toBeInTheDocument();
  });

  it('calls onReset and onSave from the header buttons', async () => {
    const onReset = vi.fn();
    const onSave = vi.fn();
    const user = setupUser();
    renderWithProviders(<EntityCustomizationSection {...baseProps({ onReset, onSave })} />);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onReset).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('shows the Saving label and disables Save when a save is pending', () => {
    renderWithProviders(<EntityCustomizationSection {...baseProps({ isSavePending: true })} />);
    const saving = screen.getByRole('button', { name: 'Saving…' });
    expect(saving).toBeDisabled();
  });

  it('calls onInspectField when an inspect button is clicked', async () => {
    const onInspectField = vi.fn();
    const user = setupUser();
    renderWithProviders(<EntityCustomizationSection {...baseProps({ onInspectField })} />);
    await user.click(screen.getByRole('button', { name: 'Inspect lastName' }));
    expect(onInspectField).toHaveBeenCalledWith('lastName');
  });

  it('switches to the Workspaces sub-tab', async () => {
    const user = setupUser();
    renderWithProviders(<EntityCustomizationSection {...baseProps()} />);
    await user.click(screen.getByRole('tab', { name: 'Workspaces' }));
    expect(await screen.findByText('Workspace layout')).toBeInTheDocument();
  });
});
