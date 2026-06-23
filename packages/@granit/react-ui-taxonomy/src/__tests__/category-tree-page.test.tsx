import { screen } from '@testing-library/react';

import { CategoryTreePage } from '../category-tree-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-taxonomy', () => ({
  CategoryTree: ({ scope, canManage }: { scope: string; canManage?: boolean }) => (
    <div data-testid="category-tree-stub" data-scope={scope} data-can-manage={String(canManage)} />
  ),
}));

const mockHasPermission = vi.fn();
vi.mock('@granit/react-authorization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

describe('CategoryTreePage', () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
  });

  it('passes the documents scope to CategoryTree', () => {
    mockHasPermission.mockReturnValue(true);
    renderWithProviders(<CategoryTreePage />);
    expect(screen.getByTestId('category-tree-stub').dataset.scope).toBe('documents');
  });

  it('grants management when the user has Taxonomy.Categories.Manage', () => {
    mockHasPermission.mockImplementation(
      (permission: string) => permission === 'Taxonomy.Categories.Manage'
    );
    renderWithProviders(<CategoryTreePage />);
    expect(screen.getByTestId('category-tree-stub').dataset.canManage).toBe('true');
  });

  it('renders read-only when the user lacks Taxonomy.Categories.Manage', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<CategoryTreePage />);
    expect(screen.getByTestId('category-tree-stub').dataset.canManage).toBe('false');
  });
});
