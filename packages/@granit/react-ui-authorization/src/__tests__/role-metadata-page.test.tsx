import { screen } from '@testing-library/react';

import { RoleMetadataPage } from '../role-metadata-page';

import { renderAuthorization } from './test-utils';

const mockUseRoleMetadata = vi.fn();
const mockUseRoleMetadataMeta = vi.fn();

vi.mock('@granit/react-authorization', () => ({
  AuthorizationProvider: ({ children }: { children: unknown }) => <>{children}</>,
  useRoleMetadata: (...args: unknown[]) => mockUseRoleMetadata(...args),
  useRoleMetadataMeta: (...args: unknown[]) => mockUseRoleMetadataMeta(...args),
}));

beforeEach(() => {
  mockUseRoleMetadataMeta.mockReturnValue({ data: undefined, isLoading: false });
  mockUseRoleMetadata.mockReturnValue({
    data: {
      items: [
        {
          id: 'a1',
          name: 'admin',
          tenantId: null,
          clientId: null,
          multiTenancySides: 'Both',
          description: 'Full administrative access',
          isSystem: true,
          isOrphaned: false,
          orphanedAt: null,
          concurrencyStamp: 'stamp',
          createdAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          modifiedAt: null,
          modifiedBy: null,
        },
      ],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    },
    isLoading: false,
  });
});

describe('RoleMetadataPage', () => {
  it('should render the title', () => {
    renderAuthorization(<RoleMetadataPage />);
    expect(screen.getByText('Role metadata')).toBeInTheDocument();
  });

  it('should render a role row', () => {
    renderAuthorization(<RoleMetadataPage />);
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
