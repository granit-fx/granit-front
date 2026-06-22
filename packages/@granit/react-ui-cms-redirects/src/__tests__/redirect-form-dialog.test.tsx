import { screen, waitFor } from '@testing-library/react';

import { RedirectFormDialog } from '../components/redirect-form-dialog';

import { mockRedirects, renderCmsRedirects } from './test-utils';

const { mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@granit/react-cms-redirects', () => ({
  useCreateRedirect: () => ({ mutate: mockCreate, isPending: false }),
  useUpdateRedirect: () => ({ mutate: mockUpdate, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

describe('RedirectFormDialog', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  it('blocks create submit when required fields are empty', async () => {
    const { user } = renderCmsRedirects(
      <RedirectFormDialog open onOpenChange={vi.fn()} siteId="site-1" redirect={null} />
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockCreate).not.toHaveBeenCalled());
  });

  it('submits a valid create payload with the site context', async () => {
    const { user } = renderCmsRedirects(
      <RedirectFormDialog open onOpenChange={vi.fn()} siteId="site-1" redirect={null} />
    );

    await user.type(screen.getByLabelText('Source path'), '/old-path');
    await user.type(screen.getByLabelText('Target path'), '/new-path');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'site-1',
        request: expect.objectContaining({ source: '/old-path', target: '/new-path' }),
      }),
      expect.anything()
    );
  });

  it('renders the edit title and disables the immutable source on edit', () => {
    renderCmsRedirects(
      <RedirectFormDialog open onOpenChange={vi.fn()} siteId="site-1" redirect={mockRedirects[0]} />
    );

    expect(screen.getByRole('heading', { name: 'Edit redirect' })).toBeInTheDocument();
    expect(screen.getByLabelText('Source path')).toBeDisabled();
  });
});
