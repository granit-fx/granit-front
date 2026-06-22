import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddHostnameDialog } from '../components/hostname-add-dialog';

import { renderHostnames } from './test-utils';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@granit/react-hostnames', () => ({
  useCheckAvailability: () => ({ data: undefined, isFetching: false, refetch: vi.fn() }),
  useCreateHostname: () => ({ mutate: mockCreate, isPending: false }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

const OWNER = { ownerType: 'tenant', ownerId: '0f8fad5b-d9cb-469f-a165-70867728950e' };

function setup() {
  return renderHostnames(<AddHostnameDialog open onOpenChange={vi.fn()} {...OWNER} />);
}

describe('AddHostnameDialog', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('blocks submit and shows a format error for a non-FQDN host', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByPlaceholderText('example.com'), 'not-a-fqdn');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(screen.getByText('Invalid hostname format.')).toBeInTheDocument());
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('blocks submit when the host is empty', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(mockCreate).not.toHaveBeenCalled());
  });

  it('submits a valid FQDN with the owner context', async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByPlaceholderText('example.com'), 'app.example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      { host: 'app.example.com', ...OWNER, isPrimary: false },
      expect.anything()
    );
  });
});
