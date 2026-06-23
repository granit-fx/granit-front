import { screen, waitFor } from '@testing-library/react';

import { DownloadVCardButton } from '../components/download-vcard-button';

import { renderWithProviders } from './test-utils';

import type { PartyId } from '@granit/parties';

const { mockDownload } = vi.hoisted(() => ({ mockDownload: vi.fn() }));

vi.mock('@granit/parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    downloadPartyVCard: (...args: unknown[]) => mockDownload(...args),
  };
});

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    usePartiesConfig: () => ({ client: {}, basePath: '/api/v1/parties' }),
  };
});

const partyId = 'party-1' as PartyId;

describe('DownloadVCardButton', () => {
  beforeEach(() => {
    mockDownload.mockReset();
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
    mockDownload.mockResolvedValue(new Blob(['BEGIN:VCARD'], { type: 'text/vcard' }));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { user } = renderWithProviders(
      <DownloadVCardButton partyId={partyId} partyName="Acme Corp!" />
    );
    await user.click(screen.getByRole('button', { name: 'Download vCard' }));

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith({}, '/api/v1/parties', partyId);
    });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('surfaces an error toast when the download fails', async () => {
    mockDownload.mockRejectedValue(new Error('network'));
    const { user } = renderWithProviders(
      <DownloadVCardButton partyId={partyId} partyName="Acme" />
    );
    await user.click(screen.getByRole('button', { name: 'Download vCard' }));
    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalled();
    });
  });
});
