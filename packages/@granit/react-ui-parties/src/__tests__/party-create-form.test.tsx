import { screen, waitFor } from '@testing-library/react';

import { PartyCreateForm } from '../components/party-create-form';

import { renderWithProviders } from './test-utils';

describe('PartyCreateForm', () => {
  it('renders the kind, name, currency, role, and submit fields', () => {
    renderWithProviders(
      <PartyCreateForm onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Default currency')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create party' })).toBeInTheDocument();
  });

  it('uppercases the currency input', async () => {
    const { user } = renderWithProviders(
      <PartyCreateForm onSubmit={vi.fn()} onCancel={vi.fn()} isPending={false} />
    );

    const currency = screen.getByLabelText('Default currency') as HTMLInputElement;
    await user.clear(currency);
    await user.type(currency, 'usd');
    expect(currency.value).toBe('USD');
  });

  it('blocks submission when required fields are empty', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <PartyCreateForm onSubmit={onSubmit} onCancel={vi.fn()} isPending={false} />
    );

    const currency = screen.getByLabelText('Default currency') as HTMLInputElement;
    await user.clear(currency);
    await user.click(screen.getByRole('button', { name: 'Create party' }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits trimmed values when the form is valid', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <PartyCreateForm onSubmit={onSubmit} onCancel={vi.fn()} isPending={false} />
    );

    await user.type(screen.getByLabelText('Name'), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: 'Create party' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const [values] = onSubmit.mock.calls[0];
    expect(values.name).toBe('Acme Corp');
    expect(values.kind).toBe('Company');
    expect(values.defaultCurrency).toBe('EUR');
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const { user } = renderWithProviders(
      <PartyCreateForm onSubmit={vi.fn()} onCancel={onCancel} isPending={false} />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
