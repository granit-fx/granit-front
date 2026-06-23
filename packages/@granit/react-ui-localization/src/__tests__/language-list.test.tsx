import { screen } from '@testing-library/react';

import { LanguageList } from '../components/language-list';

import { renderWithProviders } from './test-utils';

import type { LanguageInfo } from '@granit/localization';

const { mockUseLanguages } = vi.hoisted(() => ({ mockUseLanguages: vi.fn() }));

vi.mock('../languages-context', () => ({
  useLanguages: () => mockUseLanguages(),
}));

const mockLanguages: LanguageInfo[] = [
  { cultureName: 'fr', displayName: 'Français', flagIcon: '🇫🇷', isDefault: true },
  { cultureName: 'en', displayName: 'English', flagIcon: '🇬🇧', isDefault: false },
  { cultureName: 'nl', displayName: 'Nederlands', flagIcon: '🇳🇱', isDefault: false },
];

describe('LanguageList', () => {
  afterEach(() => vi.clearAllMocks());

  it('should return null when no languages are available', () => {
    mockUseLanguages.mockReturnValue([]);
    const { container } = renderWithProviders(<LanguageList />);
    expect(container.querySelector('[data-slot="language-list"]')).not.toBeInTheDocument();
  });

  it('should render language rows with display names and culture names', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageList />);

    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('fr')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
    expect(screen.getByText('Nederlands')).toBeInTheDocument();
    expect(screen.getByText('nl')).toBeInTheDocument();
  });

  it('should display the default badge for the default language', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageList />);

    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('should not render any toggle switch (read-only, no backend capability)', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageList />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('should render rows sorted by cultureName', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageList />);

    const rows = document.querySelectorAll('[data-slot="language-row"]');
    expect(rows).toHaveLength(3);
    // Sorted: en, fr, nl
    expect(rows[0]).toHaveTextContent('English');
    expect(rows[1]).toHaveTextContent('Français');
    expect(rows[2]).toHaveTextContent('Nederlands');
  });
});
