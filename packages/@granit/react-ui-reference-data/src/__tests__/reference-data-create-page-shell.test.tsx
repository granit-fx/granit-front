import { screen } from '@testing-library/react';

import { ReferenceDataCreatePageShell } from '../components/reference-data-create-page-shell';

import { renderWithProviders } from './test-utils';

describe('ReferenceDataCreatePageShell', () => {
  it('renders the create title, back link and children', () => {
    renderWithProviders(
      <ReferenceDataCreatePageShell i18nPrefix="ReferenceData.Common" basePath="/admin/countries">
        <div data-testid="form-slot">Form</div>
      </ReferenceDataCreatePageShell>
    );
    expect(document.querySelector('[data-slot="reference-data-create-page"]')).toBeInTheDocument();
    expect(screen.getByTestId('form-slot')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/countries');
  });
});
