import { screen, waitFor } from '@testing-library/react';

import { MetadataTab } from '../components/metadata-tab';

import { renderWithProviders } from './test-utils';

import type { PartyId } from '@granit/parties';

const { mockReplace } = vi.hoisted(() => ({
  mockReplace: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useReplacePartyMetadataMutation: () => mockReplace,
  };
});

const partyId = 'party-1' as PartyId;

describe('MetadataTab', () => {
  beforeEach(() => {
    mockReplace.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders existing metadata entries', () => {
    renderWithProviders(<MetadataTab partyId={partyId} metadata={{ segment: 'enterprise' }} />);
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByDisplayValue('segment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('enterprise')).toBeInTheDocument();
  });

  it('shows the empty state when there is no metadata', () => {
    renderWithProviders(<MetadataTab partyId={partyId} metadata={{}} />);
    expect(screen.getByText('No metadata entries.')).toBeInTheDocument();
  });

  it('adds, edits and saves an entry', async () => {
    const { user } = renderWithProviders(<MetadataTab partyId={partyId} metadata={{}} />);
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    await user.type(screen.getByLabelText('Key'), 'region');
    await user.type(screen.getByLabelText('Value'), 'EU');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockReplace.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        request: { metadata: { region: 'EU' } },
      });
    });
  });

  it('removes an entry', async () => {
    const { user } = renderWithProviders(<MetadataTab partyId={partyId} metadata={{ a: '1' }} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByDisplayValue('a')).not.toBeInTheDocument();
  });

  it('blocks saving when keys are duplicated', async () => {
    const { user } = renderWithProviders(<MetadataTab partyId={partyId} metadata={{ dup: '1' }} />);
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    const keyInputs = screen.getAllByLabelText('Key');
    await user.type(keyInputs[1]!, 'dup');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Metadata keys must be unique.')).toBeInTheDocument();
    expect(mockReplace.mutateAsync).not.toHaveBeenCalled();
  });

  it('shows the max-entries error when the cap is reached', async () => {
    const full = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`k${i}`, `v${i}`])
    ) as Record<string, string>;
    const { user } = renderWithProviders(<MetadataTab partyId={partyId} metadata={full} />);
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    expect(await screen.findByText('Maximum 50 metadata entries reached.')).toBeInTheDocument();
  });

  it('logs an error when the save mutation rejects', async () => {
    mockReplace.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<MetadataTab partyId={partyId} metadata={{ a: '1' }} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockReplace.mutateAsync).toHaveBeenCalled();
    });
  });
});
