import { screen, waitFor } from '@testing-library/react';

import { DownloadVCardButton } from '../components/download-vcard-button';

import { renderWithProviders } from './test-utils';

import type { PartyId } from '@granit/parties';

const { mockMutateAsync } = vi.hoisted(() => ({ mockMutateAsync: vi.fn() }));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDownloadPartyVCard: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  };
});

const partyId = 'party-1' as PartyId;

describe('DownloadVCardButton', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the download button', () => {
    renderWithProviders(<DownloadVCardButton partyId={partyId} partyName="Acme Corp" />);
    expect(screen.getByRole('button', { name: 'Download vCard' })).toBeInTheDocument();
  });

  it('downloads the vCard and triggers the anchor click', async () => {
    mockMutateAsync.mockResolvedValue(new Blob(['BEGIN:VCARD'], { type: 'text/vcard' }));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { user } = renderWithProviders(
      <DownloadVCardButton partyId={partyId} partyName="Acme Corp!" />
    );
    await user.click(screen.getByRole('button', { name: 'Download vCard' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(partyId);
    });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('surfaces an error toast when the download fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('network'));
    const { user } = renderWithProviders(
      <DownloadVCardButton partyId={partyId} partyName="Acme" />
    );
    await user.click(screen.getByRole('button', { name: 'Download vCard' }));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });
});
