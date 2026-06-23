import { screen } from '@testing-library/react';

import { PermissionSideBadge } from '../components/permission-side-badge';

import { renderAuthorization } from './test-utils';

import type { PermissionMultiTenancySide } from '@granit/authorization';

describe('PermissionSideBadge', () => {
  it.each<[PermissionMultiTenancySide, string]>([
    ['Host', 'Host'],
    ['Tenant', 'Tenant'],
    ['Both', 'Both'],
  ])('should render the %s side label', (side, label) => {
    renderAuthorization(<PermissionSideBadge side={side} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
