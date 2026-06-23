import { screen } from '@testing-library/react';

import { renderWithProviders } from './test-utils';

import { EntityTimeline } from '../entity-timeline';

// Mock @granit/react-timeline (hooks + provider)
const { mockUseTimeline, mockUseTimelineActions, mockUseTimelineFollowers } = vi.hoisted(() => ({
  mockUseTimeline: vi.fn(),
  mockUseTimelineActions: vi.fn(),
  mockUseTimelineFollowers: vi.fn(),
}));

vi.mock('@granit/react-timeline', () => ({
  useTimeline: mockUseTimeline,
  useTimelineActions: mockUseTimelineActions,
  useTimelineFollowers: mockUseTimelineFollowers,
  useToggleReaction: () => ({ mutate: vi.fn() }),
  useUpdateEntryBody: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  applyToggleResult: vi.fn((reactions: unknown, _result: unknown) => reactions),
}));

vi.mock('@granit/timeline', () => ({
  TimelineEntryType: { Comment: 'Comment', InternalNote: 'InternalNote', SystemLog: 'SystemLog' },
  TimelineEntryOrigin: { Native: 'Native', External: 'External' },
}));

const defaultTimeline = {
  entries: [],
  totalCount: 0,
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: false,
  loadMore: vi.fn(),
  refresh: vi.fn(),
  addOptimisticEntry: vi.fn(),
  removeOptimisticEntry: vi.fn(),
  patchEntry: vi.fn(),
  degradedSources: [],
};

const defaultActions = {
  postEntry: vi.fn().mockResolvedValue({ id: 'new' }),
  removeEntry: vi.fn().mockResolvedValue(undefined),
  posting: false,
  deleting: false,
  error: null,
};

const defaultFollowers = {
  followers: [],
  isFollowing: false,
  loading: false,
  follow: vi.fn().mockResolvedValue(undefined),
  unfollow: vi.fn().mockResolvedValue(undefined),
};

describe('EntityTimeline', () => {
  afterEach(() => vi.clearAllMocks());

  it('should display the Timeline title', () => {
    mockUseTimeline.mockReturnValue(defaultTimeline);
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('should display the empty message when there are no entries', () => {
    mockUseTimeline.mockReturnValue(defaultTimeline);
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(screen.getByText('No timeline entries yet.')).toBeInTheDocument();
  });

  it('should display the error state when loading fails', () => {
    mockUseTimeline.mockReturnValue({
      ...defaultTimeline,
      error: new Error('Network error'),
    });
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
  });

  it('should display the spinner during initial loading', () => {
    mockUseTimeline.mockReturnValue({ ...defaultTimeline, loading: true });
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the timeline entries', () => {
    mockUseTimeline.mockReturnValue({
      ...defaultTimeline,
      entries: [
        {
          id: 'e-1',
          body: 'First comment',
          entryType: 'Comment',
          authorName: 'Admin',
          occurredAt: '2026-01-01T00:00:00Z',
          entityType: 'User',
          entityId: 'u-1',
          authorId: 'a-1',
          parentEntryId: null,
          attachments: [],
        },
      ],
      totalCount: 1,
    });
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(screen.getByText('First comment')).toBeInTheDocument();
  });

  it('should pass entityType and entityId to hooks', () => {
    mockUseTimeline.mockReturnValue(defaultTimeline);
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(mockUseTimeline).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'User', entityId: 'u-1' })
    );
    expect(mockUseTimelineActions).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'User', entityId: 'u-1' })
    );
  });

  it('should have the data-slot attribute', () => {
    mockUseTimeline.mockReturnValue(defaultTimeline);
    mockUseTimelineActions.mockReturnValue(defaultActions);
    mockUseTimelineFollowers.mockReturnValue(defaultFollowers);
    renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" />);
    expect(document.querySelector('[data-slot="entity-timeline"]')).toBeInTheDocument();
  });
});
