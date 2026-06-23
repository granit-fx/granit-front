import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserCreateDialog } from './user-create-dialog';

const { mockUseCreateUser, toastSuccess } = vi.hoisted(() => ({
  mockUseCreateUser: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@granit/react-identity', () => ({
  useCreateUser: mockUseCreateUser,
}));

vi.mock('sonner', () => ({
  toast: { success: toastSuccess },
}));

describe('UserCreateDialog', () => {
  beforeEach(() => {
    mockUseCreateUser.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('does not render the dialog content when closed', () => {
    renderWithProviders(<UserCreateDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText('Create user')).not.toBeInTheDocument();
  });

  it('renders all the form fields when open', () => {
    renderWithProviders(<UserCreateDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Create user')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it('submits the trimmed form, shows a success toast and closes', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreateUser.mockReturnValue({ mutateAsync, isPending: false });
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<UserCreateDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText(/Username/), 'jdoe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        username: 'jdoe',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        enabled: true,
      });
    });
    expect(toastSuccess).toHaveBeenCalledWith('User created successfully.');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('omits empty optional name fields as undefined', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreateUser.mockReturnValue({ mutateAsync, isPending: false });
    const { user } = renderWithProviders(<UserCreateDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/Username/), 'jdoe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: undefined, lastName: undefined })
      );
    });
  });

  it('keeps the dialog open and does not toast when the mutation rejects', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('boom'));
    mockUseCreateUser.mockReturnValue({ mutateAsync, isPending: false });
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<UserCreateDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/Username/), 'jdoe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('toggles the enabled switch off and submits enabled: false', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreateUser.mockReturnValue({ mutateAsync, isPending: false });
    const { user } = renderWithProviders(<UserCreateDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/Username/), 'jdoe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });
  });

  it('resets the form and closes when cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<UserCreateDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables the submit button and shows the loading label while pending', () => {
    mockUseCreateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: true });
    renderWithProviders(<UserCreateDialog open onOpenChange={vi.fn()} />);
    const submit = screen.getByRole('button', { name: 'Loading...' });
    expect(submit).toBeDisabled();
  });
});
