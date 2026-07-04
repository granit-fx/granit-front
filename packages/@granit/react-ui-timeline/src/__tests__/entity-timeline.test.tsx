import { toast } from '@granit/react-ui';
import {
  TimelineEntryNotEditableReason,
  TimelineEntryOrigin,
  TimelineEntryType,
  toReactionEmoji,
} from '@granit/timeline';
import { toEntityId, toISODateString } from '@granit/types';
import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityTimeline } from '../entity-timeline';

import { renderWithProviders } from './test-utils';

import type { TimelineComposerProps } from '../timeline-composer';
import type {
  ReactionMap,
  ReactionToggleResponse,
  TimelineStreamEntryResponse,
} from '@granit/timeline';

// --- Mocks --------------------------------------------------------------

// Latest-mounted composer props are captured so tests can drive the
// add / reply / edit submit callbacks without a real ProseMirror editor.
const composerHolder = vi.hoisted(() => ({
  current: null as TimelineComposerProps | null,
}));

const {
  mockUseTimeline,
  mockUseTimelineActions,
  mockUseTimelineFollowers,
  mockUpdateBody,
  mockToggleReaction,
  mockApplyToggleResult,
  mockIsAxiosError,
} = vi.hoisted(() => ({
  mockUseTimeline: vi.fn(),
  mockUseTimelineActions: vi.fn(),
  mockUseTimelineFollowers: vi.fn(),
  mockUpdateBody: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
  mockToggleReaction: { mutate: vi.fn() },
  mockApplyToggleResult: vi.fn((reactions: unknown) => reactions),
  mockIsAxiosError: vi.fn(
    (err: unknown) => Boolean(err) && typeof err === 'object' && err !== null && 'response' in err
  ),
}));

vi.mock('@granit/react-timeline', () => ({
  useTimeline: mockUseTimeline,
  useTimelineActions: mockUseTimelineActions,
  useTimelineFollowers: mockUseTimelineFollowers,
  useToggleReaction: () => mockToggleReaction,
  useAnchorEntry: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useUpdateEntryBody: () => mockUpdateBody,
  applyToggleResult: mockApplyToggleResult,
  isAxiosError: mockIsAxiosError,
}));

vi.mock('../timeline-composer', () => ({
  TimelineComposer: (props: TimelineComposerProps) => {
    composerHolder.current = props;
    return (
      <div
        data-testid="mock-composer"
        data-initial={props.initialBody ?? ''}
        data-parent={props.parentEntryId ?? ''}
      />
    );
  },
}));

// --- Fixtures -----------------------------------------------------------

const NOW_ISO = new Date().toISOString();

function makeEntry(
  overrides: Partial<TimelineStreamEntryResponse> = {}
): TimelineStreamEntryResponse {
  return {
    id: toEntityId<'TimelineStreamEntryResponse'>('e-1'),
    occurredAt: toISODateString(NOW_ISO),
    entryType: TimelineEntryType.Comment,
    authorId: toEntityId<'User'>('a-1'),
    authorName: 'Admin',
    body: 'hello',
    attachments: [],
    parentEntryId: null,
    origin: TimelineEntryOrigin.Native,
    editedAt: null,
    reactions: null,
    ...overrides,
  };
}

function timeline(overrides: Record<string, unknown> = {}) {
  return {
    entries: [] as readonly TimelineStreamEntryResponse[],
    totalCount: 0,
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
    refresh: vi.fn(),
    addOptimisticEntry: vi.fn(),
    removeOptimisticEntry: vi.fn(),
    patchEntry: vi.fn((_id: unknown, updater: (entry: unknown) => unknown) => updater({})),
    degradedSources: [] as readonly string[],
    ...overrides,
  };
}

function actions(overrides: Record<string, unknown> = {}) {
  return {
    postEntry: vi.fn().mockResolvedValue({ id: 'new' }),
    removeEntry: vi.fn().mockResolvedValue(undefined),
    posting: false,
    deleting: false,
    error: null,
    ...overrides,
  };
}

function followers(overrides: Record<string, unknown> = {}) {
  return {
    followers: [] as readonly unknown[],
    isFollowing: false,
    loading: false,
    follow: vi.fn().mockResolvedValue(undefined),
    unfollow: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

interface SetupOverrides {
  timeline?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  followers?: Record<string, unknown>;
}

function setup(
  props: Partial<React.ComponentProps<typeof EntityTimeline>> = {},
  over: SetupOverrides = {}
) {
  const timelineState = timeline(over.timeline);
  const actionsState = actions(over.actions);
  const followersState = followers(over.followers);
  mockUseTimeline.mockReturnValue(timelineState);
  mockUseTimelineActions.mockReturnValue(actionsState);
  mockUseTimelineFollowers.mockReturnValue(followersState);
  const view = renderWithProviders(<EntityTimeline entityType="User" entityId="u-1" {...props} />);
  return { ...view, timelineState, actionsState, followersState };
}

function composer(): TimelineComposerProps {
  const current = composerHolder.current;
  if (!current) throw new Error('composer not mounted');
  return current;
}

async function submitComposer(body: string, parentEntryId?: string) {
  await act(async () => {
    await composer().onSubmit({
      entryType: TimelineEntryType.Comment,
      body,
      parentEntryId,
    });
  });
}

// --- Tests --------------------------------------------------------------

describe('EntityTimeline', () => {
  beforeEach(() => {
    composerHolder.current = null;
    mockUpdateBody.mutateAsync.mockReset();
    mockToggleReaction.mutate.mockReset();
    mockApplyToggleResult.mockClear();
    mockIsAxiosError.mockClear();
  });
  afterEach(() => vi.clearAllMocks());

  describe('render states', () => {
    it('displays the Timeline title', () => {
      setup();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('displays the empty message when there are no entries', () => {
      setup();
      expect(screen.getByText('No timeline entries yet.')).toBeInTheDocument();
    });

    it('displays the error state when the initial load fails', () => {
      setup({}, { timeline: { error: new Error('boom') } });
      expect(screen.getByText('Failed to load timeline')).toBeInTheDocument();
      expect(screen.getByText('Could not load timeline entries.')).toBeInTheDocument();
    });

    it('still renders the feed when an error arrives alongside cached entries', () => {
      setup(
        {},
        { timeline: { error: new Error('boom'), entries: [makeEntry({ body: 'cached' })] } }
      );
      expect(screen.queryByText('Failed to load timeline')).not.toBeInTheDocument();
      expect(screen.getByText('cached')).toBeInTheDocument();
    });

    it('displays the spinner during the initial load', () => {
      setup({}, { timeline: { loading: true } });
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('skips the initial-load layout when loading alongside cached entries', () => {
      setup({}, { timeline: { loading: true, entries: [makeEntry({ body: 'cached' })] } });
      // past the `loading && entries.length === 0` guard: full card chrome renders
      expect(screen.getByTestId('timeline-add-button')).toBeInTheDocument();
    });

    it('renders the entries', () => {
      setup({}, { timeline: { entries: [makeEntry({ body: 'First comment' })], totalCount: 1 } });
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });

    it('forwards entityType / entityId to the data hooks', () => {
      setup();
      expect(mockUseTimeline).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'User', entityId: 'u-1' })
      );
      expect(mockUseTimelineActions).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'User', entityId: 'u-1' })
      );
    });

    it('exposes the data-slot attribute', () => {
      setup();
      expect(document.querySelector('[data-slot="entity-timeline"]')).toBeInTheDocument();
    });
  });

  describe('degraded sources banner', () => {
    it('shows the banner when sources are degraded', () => {
      setup({}, { timeline: { degradedSources: ['auditing', 'workflow'] } });
      expect(screen.getByTestId('timeline-degraded-banner')).toBeInTheDocument();
    });

    it('omits the banner when no sources are degraded', () => {
      setup();
      expect(screen.queryByTestId('timeline-degraded-banner')).not.toBeInTheDocument();
    });
  });

  describe('follow toggle', () => {
    it('follows when not currently following', async () => {
      const { followersState, user } = setup();
      const btn = screen.getByTestId('timeline-follow-button');
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      await user.click(btn);
      expect(followersState.follow).toHaveBeenCalledOnce();
      expect(followersState.unfollow).not.toHaveBeenCalled();
    });

    it('unfollows and shows the follower count when already following', async () => {
      const { followersState, user } = setup(
        {},
        { followers: { isFollowing: true, followers: [{ id: 'x' }, { id: 'y' }] } }
      );
      const btn = screen.getByTestId('timeline-follow-button');
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      expect(btn).toHaveTextContent('(2)');
      await user.click(btn);
      expect(followersState.unfollow).toHaveBeenCalledOnce();
    });

    it('disables the follow button while followers are loading', async () => {
      const { followersState, user } = setup({}, { followers: { loading: true } });
      const btn = screen.getByTestId('timeline-follow-button');
      expect(btn).toBeDisabled();
      await user.click(btn);
      expect(followersState.follow).not.toHaveBeenCalled();
    });
  });

  describe('body renderer', () => {
    it('renders a mention as an in-app link surrounded by prose', () => {
      const body = 'hi @[Alice](user:11111111-1111-4111-8111-111111111111) end';
      setup({}, { timeline: { entries: [makeEntry({ body })] } });
      const link = screen.getByTestId('timeline-mention-link');
      expect(link).toHaveAttribute('href', '/identity/users/11111111-1111-4111-8111-111111111111');
      expect(link).toHaveTextContent('@Alice');
      const bodyNode = screen.getByTestId('timeline-entry-body');
      expect(bodyNode).toHaveTextContent('hi');
      expect(bodyNode).toHaveTextContent('end');
    });

    it('renders same-origin URLs as router links and cross-origin URLs as external anchors', () => {
      const origin = globalThis.location.origin;
      const body = `${origin}/local and https://external.example.test/p.`;
      setup({}, { timeline: { entries: [makeEntry({ body })] } });
      const links = screen.getAllByTestId('timeline-url-link');
      expect(links).toHaveLength(2);
      const external = links.find((l) => l.hasAttribute('data-external'));
      const internal = links.find((l) => !l.hasAttribute('data-external'));
      expect(external).toHaveAttribute('href', 'https://external.example.test/p');
      expect(external).toHaveAttribute('rel', 'noopener noreferrer');
      expect(internal).toBeDefined();
      // trailing punctuation is stripped off the URL and kept as prose
      expect(screen.getByTestId('timeline-entry-body')).toHaveTextContent('.');
    });

    it('leaves a URL-shaped token that fails to parse as plain text', () => {
      const body = 'bad http://[ end';
      setup({}, { timeline: { entries: [makeEntry({ body })] } });
      expect(screen.queryByTestId('timeline-url-link')).not.toBeInTheDocument();
      expect(screen.getByTestId('timeline-entry-body')).toHaveTextContent('http://[');
    });

    it('renders a plain-text body unchanged and an empty body without crashing', () => {
      setup(
        {},
        {
          timeline: {
            entries: [
              makeEntry({ id: toEntityId<'TimelineStreamEntryResponse'>('e-empty'), body: '' }),
            ],
          },
        }
      );
      expect(screen.getByTestId('timeline-entry-body')).toBeInTheDocument();
    });
  });

  describe('add composer dialog', () => {
    it('opens the add dialog and posts an entry on submit', async () => {
      const { actionsState, user } = setup();
      expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument();
      await user.click(screen.getByTestId('timeline-add-button'));
      const mounted = await screen.findByTestId('mock-composer');
      expect(mounted).toHaveAttribute('data-parent', '');
      expect(screen.getByText('Add timeline entry')).toBeInTheDocument();

      await submitComposer('A new comment');
      expect(actionsState.postEntry).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'A new comment' })
      );
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());
    });

    it('clears reply context after the composer dialog is dismissed', async () => {
      const entry = makeEntry({ body: 'root comment' });
      const { user } = setup({}, { timeline: { entries: [entry] } });
      await user.click(screen.getByTestId('timeline-reply-btn'));
      await screen.findByTestId('mock-composer');
      expect(screen.getByTestId('mock-composer')).toHaveAttribute('data-parent', 'e-1');
      expect(screen.getByText('Reply to entry')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());

      // reopening via Add must not carry the previous reply target
      await user.click(screen.getByTestId('timeline-add-button'));
      const reopened = await screen.findByTestId('mock-composer');
      expect(reopened).toHaveAttribute('data-parent', '');
    });
  });

  describe('reply and delete actions', () => {
    it('deletes an entry via the entry delete action', async () => {
      const { actionsState, user } = setup({}, { timeline: { entries: [makeEntry()] } });
      await user.click(screen.getByTestId('timeline-delete-btn'));
      expect(actionsState.removeEntry).toHaveBeenCalledWith('e-1');
    });
  });

  describe('edit gating (canEditEntry)', () => {
    it('renders no edit action when currentUserId is absent', () => {
      setup({}, { timeline: { entries: [makeEntry({ authorId: toEntityId<'User'>('me') })] } });
      expect(screen.queryByTestId('timeline-edit-btn')).not.toBeInTheDocument();
    });

    it("only exposes the edit action for the author's recent native non-system entry", () => {
      const editable = makeEntry({
        id: toEntityId<'TimelineStreamEntryResponse'>('editable'),
        authorId: toEntityId<'User'>('me'),
        body: 'mine recent',
      });
      const external = makeEntry({
        id: toEntityId<'TimelineStreamEntryResponse'>('external'),
        authorId: toEntityId<'User'>('me'),
        origin: TimelineEntryOrigin.External,
        body: 'external',
      });
      const systemLog = makeEntry({
        id: toEntityId<'TimelineStreamEntryResponse'>('sys'),
        authorId: toEntityId<'User'>('me'),
        entryType: TimelineEntryType.SystemLog,
        body: 'system',
      });
      const otherAuthor = makeEntry({
        id: toEntityId<'TimelineStreamEntryResponse'>('other'),
        authorId: toEntityId<'User'>('someone-else'),
        body: 'theirs',
      });
      const stale = makeEntry({
        id: toEntityId<'TimelineStreamEntryResponse'>('stale'),
        authorId: toEntityId<'User'>('me'),
        occurredAt: toISODateString('2020-01-01T00:00:00Z'),
        body: 'old',
      });
      setup(
        { currentUserId: 'me' },
        { timeline: { entries: [editable, external, systemLog, otherAuthor, stale] } }
      );
      expect(screen.getAllByTestId('timeline-edit-btn')).toHaveLength(1);
    });
  });

  describe('edit dialog submit', () => {
    const ORIGINAL = 'editable body';

    async function openEditor(user: ReturnType<typeof setup>['user']) {
      await user.click(screen.getByTestId('timeline-edit-btn'));
      const mounted = await screen.findByTestId('mock-composer');
      expect(mounted).toHaveAttribute('data-initial', ORIGINAL);
    }

    function editableSetup() {
      const editable = makeEntry({
        id: toEntityId<'TimelineStreamEntryResponse'>('editable'),
        authorId: toEntityId<'User'>('me'),
        body: ORIGINAL,
        // omit origin → exercises the `origin ?? Native` fallback in canEditEntry
        origin: undefined,
      });
      return setup({ currentUserId: 'me' }, { timeline: { entries: [editable] } });
    }

    it('closes without saving when the edited body is blank', async () => {
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer('   ');
      expect(mockUpdateBody.mutateAsync).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());
    });

    it('closes without saving when the body is unchanged', async () => {
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer(ORIGINAL);
      expect(mockUpdateBody.mutateAsync).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());
    });

    it('persists a changed body and patches the entry', async () => {
      mockUpdateBody.mutateAsync.mockResolvedValue(undefined);
      const { timelineState, user } = editableSetup();
      await openEditor(user);
      await submitComposer('a fresh body');
      expect(mockUpdateBody.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'User', entityId: 'u-1', body: 'a fresh body' })
      );
      expect(timelineState.patchEntry).toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());
    });

    it('surfaces a localised toast on a 403 not-editable rejection with a reason', async () => {
      const toastSpy = vi.spyOn(toast, 'error');
      mockUpdateBody.mutateAsync.mockRejectedValue({
        response: {
          status: 403,
          data: {
            type: 'timeline-entry-not-editable',
            extensions: { reason: TimelineEntryNotEditableReason.NotAuthor },
          },
        },
      });
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer('rejected body');
      expect(toastSpy).toHaveBeenCalledOnce();
    });

    it('falls back to a generic message when the rejection carries no reason', async () => {
      const toastSpy = vi.spyOn(toast, 'error');
      mockUpdateBody.mutateAsync.mockRejectedValue({
        response: { status: 403, data: { type: 'timeline-entry-not-editable' } },
      });
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer('rejected body');
      expect(toastSpy).toHaveBeenCalledOnce();
    });

    it('does not toast when the 403 problem type is unrelated', async () => {
      const toastSpy = vi.spyOn(toast, 'error');
      mockUpdateBody.mutateAsync.mockRejectedValue({
        response: { status: 403, data: { type: 'something-else' } },
      });
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer('rejected body');
      expect(toastSpy).not.toHaveBeenCalled();
    });

    it('does not toast when the failure is not a 403', async () => {
      const toastSpy = vi.spyOn(toast, 'error');
      mockUpdateBody.mutateAsync.mockRejectedValue({ response: { status: 500 } });
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer('rejected body');
      expect(toastSpy).not.toHaveBeenCalled();
    });

    it('does not toast when the failure is not an axios error', async () => {
      const toastSpy = vi.spyOn(toast, 'error');
      mockUpdateBody.mutateAsync.mockRejectedValue(new Error('network'));
      const { user } = editableSetup();
      await openEditor(user);
      await submitComposer('rejected body');
      expect(toastSpy).not.toHaveBeenCalled();
    });

    it('closes the edit dialog when dismissed without saving', async () => {
      const { user } = editableSetup();
      await openEditor(user);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());
    });

    it('ignores a late composer submit once the edit target has been cleared', async () => {
      mockUpdateBody.mutateAsync.mockResolvedValue(undefined);
      const { user } = editableSetup();
      await openEditor(user);
      // Dismissing the dialog clears `editingEntry`; the composer is re-seeded
      // with the null-target submit handler (initialBody undefined) before it
      // unmounts, so `composer()` now holds that stale handler.
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByTestId('mock-composer')).not.toBeInTheDocument());
      expect(composer().initialBody).toBeUndefined();
      // A submit racing the close must hit the `!editingEntry` guard and
      // short-circuit — no PATCH is issued even though the body differs.
      await submitComposer('a late body after close');
      expect(mockUpdateBody.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('reaction toggle', () => {
    it('patches the entry after a reaction resolves', async () => {
      const reactions: ReactionMap = {
        [toReactionEmoji('👍')]: { count: 2, byCurrentUser: false, displayEmoji: '👍' },
      };
      const result: ReactionToggleResponse = {
        entryId: 'e-1',
        emoji: toReactionEmoji('👍'),
        count: 3,
        currentUserHasReacted: true,
      };
      mockToggleReaction.mutate.mockImplementation(
        (_vars: unknown, opts: { onSuccess?: (r: ReactionToggleResponse) => void }) => {
          opts.onSuccess?.(result);
        }
      );
      const { timelineState, user } = setup(
        { canReact: true },
        { timeline: { entries: [makeEntry({ reactions })] } }
      );
      await user.click(screen.getByRole('button', { name: /react with/i }));
      await waitFor(() => expect(mockToggleReaction.mutate).toHaveBeenCalled());
      expect(timelineState.patchEntry).toHaveBeenCalled();
      expect(mockApplyToggleResult).toHaveBeenCalled();
    });
  });
});
