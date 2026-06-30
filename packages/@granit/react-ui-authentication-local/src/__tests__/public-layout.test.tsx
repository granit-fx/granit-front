import { screen } from '@testing-library/react';

import { PublicLayout } from '../public-layout';

import { renderWithProviders } from './test-utils';

describe('PublicLayout', () => {
  it('renders its children inside the centered card chrome', () => {
    renderWithProviders(
      <PublicLayout>
        <p>Sign-in form</p>
      </PublicLayout>
    );

    expect(screen.getByText('Sign-in form')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="public-layout"]')).toBeInTheDocument();
  });

  it('renders the host-owned branding header', () => {
    renderWithProviders(
      <PublicLayout>
        <p>body</p>
      </PublicLayout>
    );

    // `Common.AppName` is supplied by the test i18n instance (host-owned key).
    expect(screen.getByRole('heading', { name: 'Granit Showcase Admin' })).toBeInTheDocument();
  });

  it('renders an optional footer when provided', () => {
    renderWithProviders(
      <PublicLayout footer={<span>footer slot</span>}>
        <p>body</p>
      </PublicLayout>
    );

    expect(screen.getByText('footer slot')).toBeInTheDocument();
  });
});
