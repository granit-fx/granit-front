import { mockTemplateCategories } from '@granit/react-templating/testing';
import { screen, waitFor } from '@testing-library/react';

import { TemplateCategoriesDialog } from '../components/template-categories-dialog';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';
import type { TemplateCategory } from '@granit/templating';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { mockUseCategories, create, update, del } = vi.hoisted(() => ({
  mockUseCategories: vi.fn(),
  create: { mutateAsync: vi.fn() },
  update: { mutateAsync: vi.fn() },
  del: { mutateAsync: vi.fn() },
}));

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return {
    ...actual,
    useTemplateCategories: mockUseCategories,
    useTemplateCategoryMutations: () => ({ create, update, delete: del }),
  };
});

// Base on the shared Email category fixture; default templateCount to 0 so the
// category is deletable (the fixture ships a non-zero count).
const baseCategory = mockTemplateCategories[0]!;

function category(overrides: Partial<TemplateCategory> = {}): TemplateCategory {
  return { ...baseCategory, templateCount: 0, ...overrides };
}

describe('TemplateCategoriesDialog', () => {
  beforeEach(() => {
    mockUseCategories.mockReturnValue({ data: [category()], isLoading: false });
    create.mutateAsync.mockResolvedValue(undefined);
    update.mutateAsync.mockResolvedValue(undefined);
    del.mutateAsync.mockResolvedValue(undefined);
  });
  afterEach(() => vi.clearAllMocks());

  it('should render loading skeletons while loading', () => {
    mockUseCategories.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('should list existing categories', () => {
    renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Email notification templates')).toBeInTheDocument();
  });

  it('should create a new category', async () => {
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'New category' }));
    await user.type(screen.getByPlaceholderText('Name'), 'Billing');
    await user.type(screen.getByPlaceholderText('Description'), 'Invoices');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(create.mutateAsync).toHaveBeenCalledWith({ name: 'Billing', description: 'Invoices' })
    );
  });

  it('should not allow saving with a blank name', async () => {
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'New category' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('should edit an existing category', async () => {
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getByPlaceholderText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(update.mutateAsync).toHaveBeenCalledWith({
        id: baseCategory.id,
        request: { name: 'Renamed', description: baseCategory.description, sortOrder: 1 },
      })
    );
  });

  it('should delete a category with no associated templates', async () => {
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(del.mutateAsync).toHaveBeenCalledWith(baseCategory.id));
  });

  it('should disable delete for categories with associated templates', () => {
    mockUseCategories.mockReturnValue({
      data: [category({ templateCount: 5 })],
      isLoading: false,
    });
    renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('should cancel the inline form', async () => {
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'New category' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New category' })).toBeInTheDocument();
  });

  it('should log when create fails', async () => {
    const { logger } = await import('../logger');
    create.mutateAsync.mockRejectedValueOnce(new Error('x'));
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'New category' }));
    await user.type(screen.getByPlaceholderText('Name'), 'Z');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });

  it('should log when delete fails', async () => {
    const { logger } = await import('../logger');
    del.mutateAsync.mockRejectedValueOnce(new Error('x'));
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });

  it('should log when update fails', async () => {
    const { logger } = await import('../logger');
    update.mutateAsync.mockRejectedValueOnce(new Error('x'));
    const { user } = renderWithProviders(<TemplateCategoriesDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });
});
