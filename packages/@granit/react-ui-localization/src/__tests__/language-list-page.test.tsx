import { screen } from '@testing-library/react';

import { LanguageListPage } from '../language-list-page';

import { renderWithProviders } from './test-utils';

import type { LanguageInfo } from '@granit/localization';

const { mockUseLanguages } = vi.hoisted(() => ({ mockUseLanguages: vi.fn() }));

vi.mock('../languages-context', () => ({
  useLanguages: () => mockUseLanguages(),
}));

const mockLanguages: LanguageInfo[] = [
  { cultureName: 'fr', displayName: 'Français', flagIcon: '🇫🇷', isDefault: true },
  { cultureName: 'en', displayName: 'English', flagIcon: '🇬🇧', isDefault: false },
];

describe('LanguageListPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the page title and subtitle', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageListPage />);

    expect(screen.getAllByText('Languages').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Languages available in the application')).toBeInTheDocument();
  });

  it('should have the page data-slot', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageListPage />);

    expect(document.querySelector('[data-slot="language-list-page"]')).toBeInTheDocument();
  });

  it('should render the language rows', () => {
    mockUseLanguages.mockReturnValue(mockLanguages);
    renderWithProviders(<LanguageListPage />);

    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should render the title even when no languages are available', () => {
    mockUseLanguages.mockReturnValue([]);
    renderWithProviders(<LanguageListPage />);

    expect(screen.getAllByText('Languages').length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('[data-slot="language-list"]')).not.toBeInTheDocument();
  });
});
