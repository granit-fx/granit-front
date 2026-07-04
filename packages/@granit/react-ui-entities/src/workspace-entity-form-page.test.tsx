import {
  SAMPLE_ENTITY_ID,
  SAMPLE_ENTITY_NAME,
  mockEntityDiscovery,
  mockEntityManifest,
} from '@granit/react-entities/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceEntityFormPage } from './workspace-entity-form-page';

import type { WorkspaceEntityFormPageProps } from './workspace-entity-form-page';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Mocks — the page is a thin orchestrator over headless entity hooks, RHF and
// two heavy children (`<EntityForm />`, `<CollectionSectionCard />`). Both
// children have their own suites, so they are stubbed here to keep the test
// focused on this file's branches (params guard, loading / not-found / no-
// variant early returns, create vs edit submit paths, disabled states).
// ---------------------------------------------------------------------------

const {
  mockNavigate,
  mockUseParams,
  mockUseEntityMetadata,
  mockUseEntityDiscovery,
  mockUseEntity,
  mockUseEntityForm,
  mockUseCreateEntity,
  mockUseUpdateEntity,
  mockCreateMutate,
  mockUpdateMutate,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseParams: vi.fn(),
  mockUseEntityMetadata: vi.fn(),
  mockUseEntityDiscovery: vi.fn(),
  mockUseEntity: vi.fn(),
  mockUseEntityForm: vi.fn(),
  mockUseCreateEntity: vi.fn(),
  mockUseUpdateEntity: vi.fn(),
  mockCreateMutate: vi.fn(),
  mockUpdateMutate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useNavigate: () => mockNavigate, useParams: mockUseParams };
});

vi.mock('@granit/react-entities', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  EntityForm: () => <div data-testid="entity-form-stub" />,
  useEntityMetadata: mockUseEntityMetadata,
  useEntityDiscovery: mockUseEntityDiscovery,
  useEntity: mockUseEntity,
  useEntityForm: mockUseEntityForm,
  useCreateEntity: mockUseCreateEntity,
  useUpdateEntity: mockUseUpdateEntity,
}));

vi.mock('./collection-section-card', () => ({
  CollectionSectionCard: ({ section }: { readonly section: { readonly key: string } }) => (
    <div data-testid="collection-section-stub" data-key={section.key} />
  ),
}));

// ---------------------------------------------------------------------------
// i18n — empty flat bundle: `t(key, fallback)` returns the fallback (with
// `{{title}}` interpolation), matching how the app renders before backend
// bundles load. `resolveLabel(displayKey, name)` has no `t`, so it returns the
// key's last segment (`DisplayName`).
// ---------------------------------------------------------------------------

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

function wrapper({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>;
}

function renderPage(mode: WorkspaceEntityFormPageProps['mode']) {
  return render(<WorkspaceEntityFormPage mode={mode} />, { wrapper });
}

function formApi(isDirty: boolean, submitValues: Readonly<Record<string, unknown>> = {}) {
  return {
    formProps: { values: {}, onChange: vi.fn(), errors: {} },
    isDirty,
    handleSubmit:
      (cb: (values: Readonly<Record<string, unknown>>) => void) =>
      (event?: { preventDefault?: () => void }) => {
        event?.preventDefault?.();
        cb(submitValues);
      },
  };
}

const LIST_PATH = `/w/acme/${SAMPLE_ENTITY_NAME}`;
const existingEntity = { id: SAMPLE_ENTITY_ID, number: 'P-1', kind: 'Company' };

function submitForm() {
  const form = document.querySelector('[data-slot="workspace-entity-form"]');
  if (!form) throw new Error('form not rendered');
  fireEvent.submit(form);
}

beforeEach(() => {
  mockUseParams.mockReturnValue({ workspace: 'acme', entity: SAMPLE_ENTITY_NAME, id: undefined });
  mockUseEntityMetadata.mockReturnValue({ data: mockEntityManifest, isLoading: false });
  mockUseEntityDiscovery.mockReturnValue({ data: mockEntityDiscovery });
  mockUseEntity.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  mockUseEntityForm.mockReturnValue(formApi(false));
  mockUseCreateEntity.mockReturnValue({ mutate: mockCreateMutate, isPending: false });
  mockUseUpdateEntity.mockReturnValue({ mutate: mockUpdateMutate, isPending: false });
});

afterEach(() => vi.clearAllMocks());

describe('WorkspaceEntityFormPage', () => {
  describe('parameter guard', () => {
    it('renders the missing-parameter notice when the workspace param is absent', () => {
      mockUseParams.mockReturnValue({ workspace: undefined, entity: SAMPLE_ENTITY_NAME });
      renderPage('create');
      const root = document.querySelector('[data-slot="workspace-entity-form-page"]');
      expect(root).toBeInTheDocument();
      expect(screen.getByText('Missing entity parameter')).toBeInTheDocument();
    });

    it('renders the missing-parameter notice in edit mode when the id is absent', () => {
      mockUseParams.mockReturnValue({
        workspace: 'acme',
        entity: SAMPLE_ENTITY_NAME,
        id: undefined,
      });
      renderPage('edit');
      expect(screen.getByText('Missing entity parameter')).toBeInTheDocument();
    });

    it('tolerates an absent entity param (empty-string hook fallback, no base path)', () => {
      mockUseParams.mockReturnValue({ workspace: 'acme', entity: undefined, id: undefined });
      renderPage('create');
      expect(screen.getByText('Missing entity parameter')).toBeInTheDocument();
      expect(mockUseEntityMetadata).toHaveBeenCalledWith('');
    });
  });

  describe('loading state', () => {
    it('renders skeletons while the manifest is loading', () => {
      mockUseEntityMetadata.mockReturnValue({ data: undefined, isLoading: true });
      renderPage('create');
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
      expect(document.querySelector('[data-slot="workspace-entity-form-page"]')).toBeNull();
    });

    it('renders skeletons in edit mode while the existing entity is loading', () => {
      mockUseParams.mockReturnValue({
        workspace: 'acme',
        entity: SAMPLE_ENTITY_NAME,
        id: SAMPLE_ENTITY_ID,
      });
      mockUseEntity.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      renderPage('edit');
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    });
  });

  describe('not-found state', () => {
    it('renders the not-found notice and navigates back when the manifest is null', () => {
      mockUseEntityMetadata.mockReturnValue({ data: undefined, isLoading: false });
      renderPage('create');
      expect(screen.getByText('Could not load record')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
      expect(mockNavigate).toHaveBeenCalledWith(LIST_PATH);
    });

    it('renders the not-found notice in edit mode when the entity query errors', () => {
      mockUseParams.mockReturnValue({
        workspace: 'acme',
        entity: SAMPLE_ENTITY_NAME,
        id: SAMPLE_ENTITY_ID,
      });
      mockUseEntity.mockReturnValue({ data: undefined, isLoading: false, isError: true });
      renderPage('edit');
      expect(screen.getByText('Could not load record')).toBeInTheDocument();
    });
  });

  describe('no-variant state', () => {
    it('renders the no-variant notice when the manifest declares no forms', () => {
      mockUseEntityMetadata.mockReturnValue({
        data: { ...mockEntityManifest, forms: [] },
        isLoading: false,
      });
      renderPage('create');
      expect(screen.getByText('No form variant')).toBeInTheDocument();
    });
  });

  describe('create mode', () => {
    it('renders the create heading, subtitle, form and action buttons', () => {
      renderPage('create');
      expect(screen.getByText('New DisplayName')).toBeInTheDocument();
      expect(screen.getByText('DisplayName')).toBeInTheDocument();
      const form = document.querySelector('[data-slot="workspace-entity-form"]');
      expect(form).toHaveAttribute('data-mode', 'create');
      expect(screen.getByTestId('entity-form-stub')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('disables the submit button when the form is pristine and enables it when dirty', () => {
      const { rerender } = renderPage('create');
      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

      mockUseEntityForm.mockReturnValue(formApi(true));
      rerender(<WorkspaceEntityFormPage mode="create" />);
      expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
    });

    it('creates the entity and navigates to its detail page on success', () => {
      mockUseEntityForm.mockReturnValue(formApi(true, { number: 'P-9' }));
      mockCreateMutate.mockImplementation(
        (_values: unknown, opts: { onSuccess: (data: Record<string, unknown>) => void }) => {
          opts.onSuccess({ id: 'created-id' });
        }
      );
      renderPage('create');
      submitForm();
      expect(mockCreateMutate).toHaveBeenCalledWith(
        { number: 'P-9' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockNavigate).toHaveBeenCalledWith(`${LIST_PATH}/created-id`);
    });

    it('stays on the page when the create response carries no id', () => {
      mockUseEntityForm.mockReturnValue(formApi(true));
      mockCreateMutate.mockImplementation(
        (_values: unknown, opts: { onSuccess: (data: Record<string, unknown>) => void }) => {
          opts.onSuccess({});
        }
      );
      renderPage('create');
      submitForm();
      expect(mockCreateMutate).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows the saving label and disables the submit while the create mutation is pending', () => {
      mockUseEntityForm.mockReturnValue(formApi(true));
      mockUseCreateEntity.mockReturnValue({ mutate: mockCreateMutate, isPending: true });
      renderPage('create');
      const submit = screen.getByRole('button', { name: 'Saving…' });
      expect(submit).toBeDisabled();
    });

    it('falls back to the first form variant when no "default" variant exists', () => {
      const custom = mockEntityManifest.forms[0];
      mockUseEntityMetadata.mockReturnValue({
        data: { ...mockEntityManifest, forms: [{ ...custom, name: 'custom' }] },
        isLoading: false,
      });
      renderPage('create');
      expect(screen.getByTestId('entity-form-stub')).toBeInTheDocument();
    });

    it('falls back to the entity name in the title when the manifest has no identity', () => {
      mockUseEntityMetadata.mockReturnValue({
        data: { ...mockEntityManifest, identity: null },
        isLoading: false,
      });
      renderPage('create');
      expect(screen.getByText(`New ${SAMPLE_ENTITY_NAME}`)).toBeInTheDocument();
    });

    it('resolves an undefined base path when discovery has no matching entity', () => {
      mockUseParams.mockReturnValue({ workspace: 'acme', entity: 'Unknown.Entity', id: undefined });
      renderPage('create');
      expect(screen.getByTestId('entity-form-stub')).toBeInTheDocument();
      expect(mockUseCreateEntity).toHaveBeenCalledWith(
        'Unknown.Entity',
        expect.objectContaining({ basePath: undefined })
      );
    });

    it('navigates to the list from the cancel and back buttons', () => {
      renderPage('create');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mockNavigate).toHaveBeenCalledWith(LIST_PATH);
      mockNavigate.mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
      expect(mockNavigate).toHaveBeenCalledWith(LIST_PATH);
    });
  });

  describe('edit mode', () => {
    const extendedManifest = {
      ...mockEntityManifest,
      collectionSections: [
        { key: 'lines', labelKey: null, order: 2, propertyName: 'lines', columns: [] },
        { key: 'addresses', labelKey: null, order: 1, propertyName: 'addresses', columns: [] },
      ],
    };

    beforeEach(() => {
      mockUseParams.mockReturnValue({
        workspace: 'acme',
        entity: SAMPLE_ENTITY_NAME,
        id: SAMPLE_ENTITY_ID,
      });
      mockUseEntity.mockReturnValue({ data: existingEntity, isLoading: false, isError: false });
    });

    it('renders the edit heading, the save label and the collection sections sorted by order', () => {
      mockUseEntityMetadata.mockReturnValue({ data: extendedManifest, isLoading: false });
      renderPage('edit');
      expect(screen.getByText('Edit DisplayName')).toBeInTheDocument();
      expect(document.querySelector('[data-slot="workspace-entity-form"]')).toHaveAttribute(
        'data-mode',
        'edit'
      );
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      const cards = screen.getAllByTestId('collection-section-stub');
      expect(cards.map((card) => card.getAttribute('data-key'))).toEqual(['addresses', 'lines']);
    });

    it('updates the entity and navigates using the route id on success', () => {
      mockUseEntityForm.mockReturnValue(formApi(true, { number: 'P-2' }));
      mockUpdateMutate.mockImplementation(
        (_arg: unknown, opts: { onSuccess: (data: Record<string, unknown>) => void }) => {
          opts.onSuccess({});
        }
      );
      renderPage('edit');
      submitForm();
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        { id: SAMPLE_ENTITY_ID, values: { number: 'P-2' } },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      expect(mockNavigate).toHaveBeenCalledWith(`${LIST_PATH}/${SAMPLE_ENTITY_ID}`);
    });

    it('shows the saving label while the update mutation is pending', () => {
      mockUseEntityForm.mockReturnValue(formApi(true));
      mockUseUpdateEntity.mockReturnValue({ mutate: mockUpdateMutate, isPending: true });
      renderPage('edit');
      expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    });

    it('renders no collection sections when the manifest declares none', () => {
      renderPage('edit');
      expect(screen.queryByTestId('collection-section-stub')).toBeNull();
    });
  });
});
