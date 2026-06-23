import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserStatusToggle } from './user-status-toggle';

describe('UserStatusToggle', () => {
  it('should show "Enabled" when enabled is true', () => {
    renderWithProviders(<UserStatusToggle enabled={true} onToggle={vi.fn()} />);
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('should show "Disabled" when enabled is false', () => {
    renderWithProviders(<UserStatusToggle enabled={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should call onToggle when switch is clicked', async () => {
    const onToggle = vi.fn();
    const { user } = renderWithProviders(<UserStatusToggle enabled={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should disable the switch when disabled prop is true', () => {
    renderWithProviders(<UserStatusToggle enabled={true} onToggle={vi.fn()} disabled={true} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
