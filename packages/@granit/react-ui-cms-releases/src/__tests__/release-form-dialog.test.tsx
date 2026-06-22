import { fireEvent, screen, waitFor } from '@testing-library/react';

import { ReleaseFormDialog } from '../components/release-form-dialog';

import { renderCmsReleases } from './test-utils';

const createMutate = vi.fn((_arg: unknown, opts?: { onSuccess?: (r: unknown) => void }) =>
  opts?.onSuccess?.({ id: 'rel-new', concurrencyStamp: 'stamp-new' })
);
const scheduleMutate = vi.fn((_arg: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.()
);

vi.mock('@granit/react-cms', () => ({
  useCreateRelease: () => ({ mutate: createMutate, isPending: false }),
  useScheduleRelease: () => ({ mutate: scheduleMutate, isPending: false }),
}));

describe('ReleaseFormDialog', () => {
  beforeEach(() => {
    createMutate.mockClear();
    scheduleMutate.mockClear();
  });

  it('renders name, schedule and timezone fields when open', () => {
    renderCmsReleases(<ReleaseFormDialog open onOpenChange={vi.fn()} siteId="site-1" />);
    expect(screen.getByRole('heading', { name: 'New release' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Schedule at')).toBeInTheDocument();
  });

  it('creates with the trimmed name and no schedule when no date is set', async () => {
    const { user } = renderCmsReleases(
      <ReleaseFormDialog open onOpenChange={vi.fn()} siteId="site-1" />
    );

    await user.type(screen.getByLabelText('Name'), '  Spring relaunch  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toEqual({ siteId: 'site-1', name: 'Spring relaunch' });
    expect(scheduleMutate).not.toHaveBeenCalled();
  });

  it('schedules after create when a date is provided', async () => {
    const { user } = renderCmsReleases(
      <ReleaseFormDialog open onOpenChange={vi.fn()} siteId="site-1" />
    );

    await user.type(screen.getByLabelText('Name'), 'Scheduled release');
    fireEvent.change(screen.getByLabelText('Schedule at'), {
      target: { value: '2026-07-01T09:00' },
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(scheduleMutate).toHaveBeenCalledTimes(1));
    const [arg] = scheduleMutate.mock.calls[0] as [
      { id: string; request: { localDateTime: string; timeZoneId: string } },
    ];
    expect(arg.id).toBe('rel-new');
    expect(arg.request.localDateTime).toBe('2026-07-01T09:00');
    expect(typeof arg.request.timeZoneId).toBe('string');
  });

  it('does not submit when the name is empty', async () => {
    const { user } = renderCmsReleases(
      <ReleaseFormDialog open onOpenChange={vi.fn()} siteId="site-1" />
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(createMutate).not.toHaveBeenCalled());
  });
});
