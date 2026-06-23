import { screen } from '@testing-library/react';

import { DevicePage } from '../device/device-page';

import { renderWithProviders } from './test-utils';

const submit = vi.fn();
let deviceState: {
  status: 'idle' | 'pending' | 'error' | 'success';
  errorCode: string | null;
  submit: typeof submit;
} = { status: 'idle', errorCode: null, submit };

vi.mock('@granit/react-openiddict-admin', () => ({
  useDeviceVerification: () => deviceState,
}));

beforeEach(() => {
  submit.mockReset();
  deviceState = { status: 'idle', errorCode: null, submit };
});

describe('DevicePage', () => {
  it('renders the device authorization form', () => {
    renderWithProviders(<DevicePage />);
    expect(screen.getByRole('heading', { name: 'Device Authorization' })).toBeInTheDocument();
    expect(screen.getByLabelText(/device code/i)).toBeInTheDocument();
  });

  it('prefills the user code from the URL', () => {
    renderWithProviders(<DevicePage />, { route: '/device?user_code=WDJB-MJHT' });
    expect(screen.getByLabelText(/device code/i)).toHaveValue('WDJB-MJHT');
  });

  it('submits the trimmed user code', async () => {
    const { user } = renderWithProviders(<DevicePage />);
    await user.type(screen.getByLabelText(/device code/i), 'ABCD-1234');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(submit).toHaveBeenCalledWith('ABCD-1234');
  });

  it('disables the submit button while verification is pending', () => {
    deviceState = { status: 'pending', errorCode: null, submit };
    renderWithProviders(<DevicePage />, { route: '/device?user_code=X' });
    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();
  });

  it('surfaces the OAuth error code on failure', () => {
    deviceState = { status: 'error', errorCode: 'expired_token', submit };
    renderWithProviders(<DevicePage />);
    expect(screen.getByText('expired_token')).toBeInTheDocument();
  });

  it('shows the success state once the device is authorized', () => {
    deviceState = { status: 'success', errorCode: null, submit };
    renderWithProviders(<DevicePage />);
    expect(screen.getByText(/device authorized/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument();
  });
});
