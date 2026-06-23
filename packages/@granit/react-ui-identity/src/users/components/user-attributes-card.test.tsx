import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserAttributesCard } from './user-attributes-card';

let mockAttributesData: Record<string, string> | undefined;
let mockIsLoading = false;

vi.mock('@granit/react-identity', () => ({
  useProviderUser: () => ({
    data: mockAttributesData !== undefined ? { metadata: mockAttributesData } : undefined,
    isLoading: mockIsLoading,
  }),
}));

describe('UserAttributesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAttributesData = undefined;
    mockIsLoading = false;
  });

  it('should render skeleton when loading', () => {
    mockIsLoading = true;

    const { container } = renderWithProviders(<UserAttributesCard userId="user-1" />);

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state when no attributes', () => {
    mockAttributesData = {};
    mockIsLoading = false;

    renderWithProviders(<UserAttributesCard userId="user-1" />);

    expect(screen.getByText('No custom attributes')).toBeInTheDocument();
  });

  it('should render attributes as key-value pairs', () => {
    mockAttributesData = {
      department: 'engineering',
      locale: 'fr-BE',
      tier: 'premium',
    };
    mockIsLoading = false;

    renderWithProviders(<UserAttributesCard userId="user-1" />);

    expect(screen.getByText('department')).toBeInTheDocument();
    expect(screen.getByText('engineering')).toBeInTheDocument();
    expect(screen.getByText('locale')).toBeInTheDocument();
    expect(screen.getByText('fr-BE')).toBeInTheDocument();
    expect(screen.getByText('tier')).toBeInTheDocument();
    expect(screen.getByText('premium')).toBeInTheDocument();
  });
});
