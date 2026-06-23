import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CustomizationPage } from '../customization-page';

import { renderWithProviders } from './test-utils';

// Radix Select sets `pointer-events: none` on portal layers in jsdom, which
// trips user-event's pointer guard; disable that check for these tests.
const setupUser = () => userEvent.setup({ delay: null, pointerEventsCheck: 0 });

async function pickEntity(user: ReturnType<typeof setupUser>, name: string) {
  await user.click(screen.getAllByRole('combobox')[0]);
  await user.click(await screen.findByRole('option', { name }));
}

// ---------------------------------------------------------------------------
// Mocks — only the headless data layer is stubbed; the real @granit/react-ui
// Tabs/Select/Sheet render. The heavy layout editors are replaced with light
// stubs that expose their onChange so draft mutation can be driven.
// ---------------------------------------------------------------------------

const {
  mockHasPermission,
  mockUseEntityDiscovery,
  mockUseEntityMetadata,
  mockUseEntityCustomization,
  mockPutMutate,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockHasPermission: vi.fn(),
  mockUseEntityDiscovery: vi.fn(),
  mockUseEntityMetadata: vi.fn(),
  mockUseEntityCustomization: vi.fn(),
  mockPutMutate: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

vi.mock('@granit/react-entities', () => ({
  useEntityDiscovery: () => mockUseEntityDiscovery(),
  useEntityMetadata: (name: string) => mockUseEntityMetadata(name),
}));

vi.mock('@granit/react-entities-customization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useEntityCustomization: (args: unknown) => mockUseEntityCustomization(args),
  usePutEntityCustomization: () => ({ mutate: mockPutMutate, isPending: false }),
  // Light stubs so the section renders predictably and onChange can be fired.
  FormLayoutEditor: ({
    fields,
    onChange,
  }: {
    readonly fields: ReadonlyArray<{ readonly name: string }>;
    readonly onChange: (deltas: readonly unknown[]) => void;
  }) => (
    <div data-slot="form-layout-editor">
      <span>fields:{fields.length}</span>
      <button
        type="button"
        onClick={() => onChange([{ $type: 'hide', fieldName: fields[0]?.name }])}
      >
        hide-first
      </button>
    </div>
  ),
}));

// Views tab reaches into react-entities-views / react-workspaces; the Views tab
// is not mounted by these layout-focused tests (defaultValue is "layouts"), but
// the module graph still imports them, so stub minimally.
vi.mock('@granit/react-entities-views', () => ({
  useCreateEntityView: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEntityView: () => ({ mutate: vi.fn(), isPending: false }),
  useSetEntityViewPersonalDefault: () => ({ mutate: vi.fn(), isPending: false }),
  useSetEntityViewPinned: () => ({ mutate: vi.fn(), isPending: false }),
  useSetEntityViewTenantDefault: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateEntityView: () => ({ mutate: vi.fn(), isPending: false }),
  useEntityViews: () => ({ data: [], isLoading: false }),
}));

vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => ({ data: { workspaces: [] }, isLoading: false }),
}));

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

const DISCOVERY = {
  data: { modules: [{ items: [{ name: 'Customer' }, { name: 'Invoice' }] }] },
  isLoading: false,
};

const MANIFEST = {
  data: {
    forms: [
      {
        name: 'default',
        sections: [
          {
            key: 'general',
            labelKey: 'General',
            fields: [
              { propertyName: 'firstName', labelKey: 'First name' },
              { propertyName: 'lastName', labelKey: null },
            ],
          },
        ],
      },
    ],
  },
  isLoading: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CustomizationPageContent (Layouts tab)', () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockUseEntityDiscovery.mockReturnValue(DISCOVERY);
    mockUseEntityMetadata.mockReturnValue({ data: undefined, isLoading: false });
    mockUseEntityCustomization.mockReturnValue({ data: undefined, isLoading: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the entity/layout pickers and the empty-state prompt', () => {
    renderWithProviders(<CustomizationPage />);
    expect(screen.getByText('Entity')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Pick an entity to start editing.')).toBeInTheDocument();
  });

  it('lists discovered entities in the entity picker', async () => {
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await user.click(screen.getAllByRole('combobox')[0]);
    expect(await screen.findByRole('option', { name: 'Customer' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Invoice' })).toBeInTheDocument();
  });

  it('shows a spinner while the manifest is loading after picking an entity', async () => {
    mockUseEntityMetadata.mockReturnValue({ data: undefined, isLoading: true });
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await pickEntity(user, 'Customer');
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeTruthy());
  });

  it('renders the form editor with fields once an entity is selected', async () => {
    mockUseEntityMetadata.mockReturnValue(MANIFEST);
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await pickEntity(user, 'Customer');
    expect(await screen.findByText('Form layout')).toBeInTheDocument();
    expect(screen.getByText('fields:2')).toBeInTheDocument();
    // Inspect buttons render one per field.
    expect(screen.getByRole('button', { name: 'Inspect firstName' })).toBeInTheDocument();
  });

  it('changes the layout kind via the layout picker', async () => {
    mockUseEntityMetadata.mockReturnValue(MANIFEST);
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    // The layout picker (2nd combobox) shows the current value "FormDefault".
    await user.click(screen.getAllByRole('combobox')[1]);
    await user.click(await screen.findByRole('option', { name: 'List' }));
    await waitFor(() =>
      expect(mockUseEntityCustomization).toHaveBeenCalledWith(
        expect.objectContaining({ layoutKind: 'List' })
      )
    );
  });

  it('saves the draft and toasts success', async () => {
    mockUseEntityMetadata.mockReturnValue(MANIFEST);
    mockPutMutate.mockImplementation((_args, opts) => opts?.onSuccess?.());
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await pickEntity(user, 'Customer');
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(mockPutMutate).toHaveBeenCalledWith(
      expect.objectContaining({ entityName: 'Customer', layoutKind: 'FormDefault' }),
      expect.any(Object)
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Form layout saved');
  });

  it('resets the draft to server deltas', async () => {
    mockUseEntityMetadata.mockReturnValue(MANIFEST);
    mockUseEntityCustomization.mockReturnValue({
      data: { deltas: [{ $type: 'hide', fieldName: 'lastName' }] },
      isLoading: false,
    });
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await pickEntity(user, 'Customer');
    // Mutate the draft then reset — both code paths exercised without throwing.
    await user.click(await screen.findByRole('button', { name: 'hide-first' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Form layout')).toBeInTheDocument();
  });

  it('opens the field inspector sheet and reflects a hidden override', async () => {
    mockUseEntityMetadata.mockReturnValue(MANIFEST);
    mockUseEntityCustomization.mockReturnValue({
      data: { deltas: [{ $type: 'hide', fieldName: 'firstName' }] },
      isLoading: false,
    });
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await pickEntity(user, 'Customer');
    await user.click(await screen.findByRole('button', { name: 'Inspect firstName' }));
    const sheet = await waitFor(() => {
      const el = document.querySelector('[data-slot="sheet-content"]');
      if (!el) throw new Error('sheet not open');
      return el as HTMLElement;
    });
    expect(within(sheet).getByText('Hidden')).toBeInTheDocument();
  });

  it('does not save when no entity is selected', async () => {
    // No entity selected -> editor not shown -> handleSave guard unreachable via UI,
    // so this asserts the empty path keeps the prompt visible.
    renderWithProviders(<CustomizationPage />);
    expect(screen.getByText('Pick an entity to start editing.')).toBeInTheDocument();
    expect(mockPutMutate).not.toHaveBeenCalled();
  });

  it('falls back to the first form when no "default" form exists', async () => {
    mockUseEntityMetadata.mockReturnValue({
      data: {
        forms: [
          {
            name: 'custom',
            sections: [
              { key: 's1', labelKey: null, fields: [{ propertyName: 'x', labelKey: null }] },
            ],
          },
        ],
      },
      isLoading: false,
    });
    const user = setupUser();
    renderWithProviders(<CustomizationPage />);
    await pickEntity(user, 'Customer');
    expect(await screen.findByText('fields:1')).toBeInTheDocument();
  });
});
