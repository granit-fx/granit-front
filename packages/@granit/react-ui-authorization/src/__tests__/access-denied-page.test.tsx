import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccessDeniedPage } from '../components/access-denied-page';

import { renderAuthorization } from './test-utils';

describe('AccessDeniedPage', () => {
  it('renders the title and the access-denied message', () => {
    renderAuthorization(<AccessDeniedPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText('You do not have the required permissions to access this page.')
    ).toBeInTheDocument();
  });

  it('shows the connected email when provided', () => {
    renderAuthorization(<AccessDeniedPage userEmail="marie@granit.test" />);
    expect(screen.getByText('marie@granit.test')).toBeInTheDocument();
  });

  it('renders the sign-out button only when onSignOut is given and calls it', async () => {
    const onSignOut = vi.fn();
    const { rerender } = renderAuthorization(<AccessDeniedPage />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<AccessDeniedPage onSignOut={onSignOut} />);
    await userEvent.click(screen.getByRole('button', { name: 'Switch account' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
