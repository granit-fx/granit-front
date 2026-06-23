import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntityViewsTab } from '../components/entity-views-tab';

import { renderWithProviders } from './test-utils';

import type { EntityViewResponse } from '@granit/entities-views';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockUseEntityDiscovery,
  mockUseEntityViews,
  mockCreateMutate,
  mockUpdateMutate,
  mockDeleteMutate,
  mockPinMutate,
  mockTenantMutate,
  mockPersonalMutate,
  mockCreatePending,
  mockUpdatePending,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockUseEntityDiscovery: vi.fn(),
  mockUseEntityViews: vi.fn(),
  mockCreateMutate: vi.fn(),
  mockUpdateMutate: vi.fn(),
  mockDeleteMutate: vi.fn(),
  mockPinMutate: vi.fn(),
  mockTenantMutate: vi.fn(),
  mockPersonalMutate: vi.fn(),
  mockCreatePending: { value: false },
  mockUpdatePending: { value: false },
  mockToastSuccess: vi.fn(),
}));

vi.mock('@granit/react-entities', () => ({
  useEntityDiscovery: () => mockUseEntityDiscovery(),
}));

vi.mock('@granit/react-entities-views', () => ({
  useCreateEntityView: () => ({ mutate: mockCreateMutate, isPending: mockCreatePending.value }),
  useUpdateEntityView: () => ({ mutate: mockUpdateMutate, isPending: mockUpdatePending.value }),
  useDeleteEntityView: () => ({ mutate: mockDeleteMutate, isPending: false }),
  useSetEntityViewPinned: () => ({ mutate: mockPinMutate, isPending: false }),
  useSetEntityViewTenantDefault: () => ({ mutate: mockTenantMutate, isPending: false }),
  useSetEntityViewPersonalDefault: () => ({ mutate: mockPersonalMutate, isPending: false }),
  useEntityViews: () => mockUseEntityViews(),
}));

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

const setupUser = () => userEvent.setup({ delay: null, pointerEventsCheck: 0 });

const DISCOVERY = {
  data: { modules: [{ items: [{ name: 'Customer' }] }] },
  isLoading: false,
};

function makeView(overrides: Partial<EntityViewResponse> = {}): EntityViewResponse {
  return {
    id: 'v1',
    name: 'My list',
    kind: 'list',
    visibility: 'Personal',
    description: 'A description',
    icon: null,
    state: {},
    isPinned: false,
    isDefault: false,
    isPersonalDefault: false,
    ...overrides,
  } as EntityViewResponse;
}

async function selectCustomer(user: ReturnType<typeof setupUser>) {
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByRole('option', { name: 'Customer' }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EntityViewsTab', () => {
  beforeEach(() => {
    mockUseEntityDiscovery.mockReturnValue(DISCOVERY);
    mockUseEntityViews.mockReturnValue({ data: [], isLoading: false });
    mockCreatePending.value = false;
    mockUpdatePending.value = false;
  });

  afterEach(() => vi.clearAllMocks());

  it('shows the pick-entity prompt and a disabled New view button initially', () => {
    renderWithProviders(<EntityViewsTab />);
    expect(screen.getByText('Pick an entity to see its views.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New view' })).toBeDisabled();
  });

  it('shows a spinner while views are loading', async () => {
    mockUseEntityViews.mockReturnValue({ data: undefined, isLoading: true });
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeTruthy());
  });

  it('shows the empty message when the entity has no views', async () => {
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    expect(await screen.findByText('No views yet for this entity.')).toBeInTheDocument();
  });

  it('renders a row per view with visibility badge and kind', async () => {
    mockUseEntityViews.mockReturnValue({
      data: [
        makeView({ id: 'v1', name: 'Shared list', visibility: 'Shared', kind: 'kanban' }),
        makeView({ id: 'v2', name: 'Tenant cal', visibility: 'Tenant', description: null }),
      ],
      isLoading: false,
    });
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    expect(await screen.findByText('Shared list')).toBeInTheDocument();
    expect(screen.getByText('Tenant cal')).toBeInTheDocument();
    expect(screen.getByText('kanban')).toBeInTheDocument();
    // Description renders for the first, not the second.
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('toggles pin, tenant-default and personal-default from a row', async () => {
    mockUseEntityViews.mockReturnValue({ data: [makeView()], isLoading: false });
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(await screen.findByRole('button', { name: 'Pin' }));
    expect(mockPinMutate).toHaveBeenCalledWith({ id: 'v1', value: true });
    await user.click(screen.getByRole('button', { name: 'Set as tenant default' }));
    expect(mockTenantMutate).toHaveBeenCalledWith({ id: 'v1', value: true });
    await user.click(screen.getByRole('button', { name: 'Set as personal default' }));
    expect(mockPersonalMutate).toHaveBeenCalledWith({ id: 'v1', value: true });
  });

  it('reflects active states with the inverse action titles', async () => {
    mockUseEntityViews.mockReturnValue({
      data: [makeView({ isPinned: true, isDefault: true, isPersonalDefault: true })],
      isLoading: false,
    });
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    expect(await screen.findByRole('button', { name: 'Unpin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove tenant default' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove personal default' })).toBeInTheDocument();
  });

  it('creates a view through the create dialog', async () => {
    mockCreateMutate.mockImplementation((_body, opts) => opts?.onSuccess?.());
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(screen.getByRole('button', { name: 'New view' }));
    const nameInput = await screen.findByPlaceholderText('My view');
    await user.type(nameInput, 'New view name');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        basedOn: 'Customer:default',
        kind: 'list',
        name: 'New view name',
      }),
      expect.any(Object)
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('View created');
  });

  it('does not submit the create form with a blank name', async () => {
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(screen.getByRole('button', { name: 'New view' }));
    await screen.findByPlaceholderText('My view');
    // Submitting with empty name -> guard returns early.
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('closes the create dialog via Cancel', async () => {
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(screen.getByRole('button', { name: 'New view' }));
    await screen.findByPlaceholderText('My view');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('My view')).not.toBeInTheDocument());
  });

  it('changes the kind in the create dialog', async () => {
    mockCreateMutate.mockImplementation((_body, opts) => opts?.onSuccess?.());
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(screen.getByRole('button', { name: 'New view' }));
    await screen.findByPlaceholderText('My view');
    // The kind select is the second combobox once the dialog is open.
    const combos = screen.getAllByRole('combobox');
    await user.click(combos[combos.length - 1]);
    await user.click(await screen.findByRole('option', { name: 'kanban' }));
    await user.type(screen.getByPlaceholderText('My view'), 'K');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'kanban' }),
      expect.any(Object)
    );
  });

  it('submits the edit dialog with the synced view name', async () => {
    // NOTE: EditViewDialog re-syncs `name` from the view prop on every render
    // while `name !== view.name` (its "view changed" guard), so in-dialog edits
    // are immediately reverted to the source name. This test exercises the
    // submit path with the synced value; see the reported source bug.
    mockUseEntityViews.mockReturnValue({ data: [makeView()], isLoading: false });
    mockUpdateMutate.mockImplementation((_args, opts) => opts?.onSuccess?.());
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'v1', request: expect.objectContaining({ name: 'My list' }) }),
      expect.any(Object)
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('View updated');
  });

  it('closes the edit dialog via Cancel without mutating', async () => {
    mockUseEntityViews.mockReturnValue({ data: [makeView()], isLoading: false });
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mockUpdateMutate).not.toHaveBeenCalled();
  });

  it('deletes a view via the confirmation dialog', async () => {
    mockUseEntityViews.mockReturnValue({ data: [makeView()], isLoading: false });
    mockDeleteMutate.mockImplementation((_id, opts) => opts?.onSuccess?.());
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(mockDeleteMutate).toHaveBeenCalledWith('v1', expect.any(Object));
    expect(mockToastSuccess).toHaveBeenCalledWith('View deleted');
  });

  it('clears the deleting id when the delete request errors', async () => {
    mockUseEntityViews.mockReturnValue({ data: [makeView()], isLoading: false });
    mockDeleteMutate.mockImplementation((_id, opts) => opts?.onError?.(new Error('boom')));
    const user = setupUser();
    renderWithProviders(<EntityViewsTab />);
    await selectCustomer(user);
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(mockDeleteMutate).toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
});
