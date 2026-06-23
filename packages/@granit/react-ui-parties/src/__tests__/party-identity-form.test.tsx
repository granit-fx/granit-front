import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { PartyIdentityForm } from '../components/party-identity-form';

import { renderWithProviders } from './test-utils';

const { mockUpdate } = vi.hoisted(() => ({
  mockUpdate: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useUpdatePartyMutation: () => mockUpdate,
  };
});

describe('PartyIdentityForm', () => {
  beforeEach(() => {
    mockUpdate.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the identity fields pre-filled from the party', () => {
    renderWithProviders(<PartyIdentityForm party={sampleParty} />);
    expect(screen.getByLabelText('Name')).toHaveValue('Acme Corp');
  });

  it('keeps the save button disabled until the form is dirty', () => {
    renderWithProviders(<PartyIdentityForm party={sampleParty} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('submits the updated identity', async () => {
    const { user } = renderWithProviders(<PartyIdentityForm party={sampleParty} />);
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Acme Corporation');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockUpdate.mutateAsync).toHaveBeenCalledWith({
        id: sampleParty.id,
        request: expect.objectContaining({ name: 'Acme Corporation' }),
      });
    });
  });

  it('submits an edited website, language and notes', async () => {
    const { user } = renderWithProviders(<PartyIdentityForm party={sampleParty} />);
    await user.type(screen.getByLabelText('Website'), '/extra');
    await user.clear(screen.getByLabelText('Language'));
    await user.type(screen.getByLabelText('Language'), 'en-GB');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockUpdate.mutateAsync).toHaveBeenCalledWith({
        id: sampleParty.id,
        request: expect.objectContaining({ language: 'en-GB' }),
      });
    });
  });

  it('logs an error when the update mutation rejects', async () => {
    mockUpdate.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<PartyIdentityForm party={sampleParty} />);
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Changed');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockUpdate.mutateAsync).toHaveBeenCalled();
    });
  });
});
