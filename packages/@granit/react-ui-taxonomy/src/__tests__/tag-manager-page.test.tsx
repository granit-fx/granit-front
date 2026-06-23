import { screen } from '@testing-library/react';

import { TagManagerPage } from '../tag-manager-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-taxonomy', () => ({
  TagManager: ({ scope, canManage }: { scope: string; canManage?: boolean }) => (
    <div data-testid="tag-manager-stub" data-scope={scope} data-can-manage={String(canManage)} />
  ),
}));

const mockHasPermission = vi.fn();
vi.mock('@granit/react-authorization', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

describe('TagManagerPage', () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
  });

  it('passes the documents scope to TagManager', () => {
    mockHasPermission.mockReturnValue(true);
    renderWithProviders(<TagManagerPage />);
    const stub = screen.getByTestId('tag-manager-stub');
    expect(stub.dataset.scope).toBe('documents');
  });

  it('grants management when the user has Taxonomy.Tags.Manage', () => {
    mockHasPermission.mockImplementation(
      (permission: string) => permission === 'Taxonomy.Tags.Manage'
    );
    renderWithProviders(<TagManagerPage />);
    expect(screen.getByTestId('tag-manager-stub').dataset.canManage).toBe('true');
  });

  it('renders read-only when the user lacks Taxonomy.Tags.Manage', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<TagManagerPage />);
    expect(screen.getByTestId('tag-manager-stub').dataset.canManage).toBe('false');
  });
});
