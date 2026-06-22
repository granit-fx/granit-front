import { mockReleases } from '@granit/react-cms/testing';
import { screen } from '@testing-library/react';

import { ReleaseDetailPage } from '../release-detail-page';

import { renderCmsReleases } from './test-utils';

const draftRelease = mockReleases[0]!; // schedule: null
const scheduledRelease = mockReleases[1]!; // schedule set, status Ready

let currentRelease = draftRelease;

vi.mock('@granit/react-cms', () => ({
  useRelease: () => ({ data: currentRelease, isLoading: false, isError: false }),
  useScheduleRelease: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelRelease: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('ReleaseDetailPage', () => {
  describe('without a schedule', () => {
    beforeEach(() => {
      currentRelease = draftRelease;
    });

    it('renders the release name and the scheduling section', () => {
      renderCmsReleases(<ReleaseDetailPage />, {
        route: `/cms/sites/site-1/releases/${draftRelease.id}`,
      });
      expect(screen.getByRole('heading', { name: draftRelease.name })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Scheduling' })).toBeInTheDocument();
      expect(screen.getByText('Not scheduled.')).toBeInTheDocument();
      expect(screen.getByLabelText('Schedule at')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
    });
  });

  describe('with a schedule', () => {
    beforeEach(() => {
      currentRelease = scheduledRelease;
    });

    it('shows the current schedule and a cancel button', () => {
      renderCmsReleases(<ReleaseDetailPage />, {
        route: `/cms/sites/site-1/releases/${scheduledRelease.id}`,
      });
      expect(screen.getByRole('button', { name: 'Cancel schedule' })).toBeInTheDocument();
      expect(screen.getByText(/Europe\/Brussels/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument();
    });
  });
});
