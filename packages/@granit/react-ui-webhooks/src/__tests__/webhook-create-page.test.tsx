import { screen } from '@testing-library/react';

import { WebhookCreatePage } from '../webhook-create-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-webhooks', () => ({
  useCreateSubscription: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEventTypes: () => ({ data: ['user.created', 'user.updated'], isLoading: false }),
}));

describe('WebhookCreatePage', () => {
  it('should render page heading', () => {
    renderWithProviders(<WebhookCreatePage />);
    expect(screen.getByRole('heading', { name: 'New subscription' })).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<WebhookCreatePage />);
    expect(document.querySelector('[data-slot="webhook-create-page"]')).toBeInTheDocument();
  });
});
