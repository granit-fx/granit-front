import { screen } from '@testing-library/react';

import { PartyRolesBadges } from '../components/party-roles-badges';
import { PartyStatusBadge } from '../components/party-status-badge';

import { renderWithProviders } from './test-utils';

describe('PartyRolesBadges', () => {
  it('renders a badge per parsed role', () => {
    renderWithProviders(<PartyRolesBadges roles="Customer, Supplier" />);
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });

  it('renders the None fallback when no roles are present', () => {
    renderWithProviders(<PartyRolesBadges roles={null} />);
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('renders the None fallback for an empty string', () => {
    renderWithProviders(<PartyRolesBadges roles="" />);
    expect(screen.getByText('None')).toBeInTheDocument();
  });
});

describe('PartyStatusBadge', () => {
  it.each(['Active', 'Suspended', 'Archived'] as const)('renders the %s status', (status) => {
    renderWithProviders(<PartyStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });
});
