import { TimelineEntryType, TimelineEntryOrigin } from '@granit/timeline';
import { toEntityId, toISODateString } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from './__tests__/test-utils';
import { TimelineEntry } from './timeline-entry';

import type {
  ReactionEmoji,
  ReactionMap,
  ReactionToggleResponse,
  TimelineStreamEntryResponse,
} from '@granit/timeline';

// Only the two mutation hooks TimelineEntry imports are mocked; the rest of
// the render path (ReactionStrip, avatar, formatting) runs for real so the
// component's branches are genuinely exercised.
const hoisted = vi.hoisted(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
}));

vi.mock('@granit/react-timeline', () => ({
  useToggleReaction: () => ({ mutate: hoisted.mutate }),
  useAnchorEntry: () => ({ mutateAsync: hoisted.mutateAsync }),
}));

const THUMBS_UP = '👍' as ReactionEmoji;
const PARTY = '🎉' as ReactionEmoji;

const reactions: ReactionMap = {
  [THUMBS_UP]: { count: 3, byCurrentUser: true, displayEmoji: '👍' },
  [PARTY]: { count: 1, byCurrentUser: false, displayEmoji: '🎉' },
} as ReactionMap;

function makeEntry(
  overrides: Partial<TimelineStreamEntryResponse> = {}
): TimelineStreamEntryResponse {
  return {
    id: toEntityId<'TimelineStreamEntryResponse'>('tl-1'),
    entryType: TimelineEntryType.Comment,
    body: 'Account created and initial roles assigned.',
    authorId: toEntityId<'User'>('admin-001'),
    authorName: 'System Admin',
    parentEntryId: null,
    occurredAt: toISODateString('2026-05-10T09:30:00Z'),
    attachments: [],
    ...overrides,
  };
}

const toggleResult: ReactionToggleResponse = {
  emoji: THUMBS_UP,
  count: 4,
  currentUserHasReacted: true,
} as ReactionToggleResponse;

beforeEach(() => {
  hoisted.mutate.mockReset();
  hoisted.mutateAsync.mockReset();
  // Default: invoke onSuccess synchronously so onReactionToggled fires.
  hoisted.mutate.mockImplementation(
    (_vars: unknown, opts?: { onSuccess?: (result: ReactionToggleResponse) => void }) => {
      opts?.onSuccess?.(toggleResult);
    }
  );
  hoisted.mutateAsync.mockResolvedValue(toEntityId<'TimelineStreamEntryResponse'>('tl-shadow'));
});

describe('TimelineEntry', () => {
  it('renders a comment entry with author, body and comment type', () => {
    renderWithProviders(<TimelineEntry entry={makeEntry()} />);
    const article = screen.getByTestId('timeline-entry');
    expect(article).toHaveAttribute('data-entry-type', 'comment');
    expect(article).toHaveAttribute('data-depth', '0');
    expect(article.getAttribute('style') ?? '').not.toContain('margin-left');
    expect(screen.getByTestId('timeline-entry-author')).toHaveTextContent('System Admin');
    expect(screen.getByTestId('timeline-entry-body')).toHaveTextContent(
      'Account created and initial roles assigned.'
    );
  });

  it('renders internal-note type', () => {
    renderWithProviders(
      <TimelineEntry entry={makeEntry({ entryType: TimelineEntryType.InternalNote })} />
    );
    expect(screen.getByTestId('timeline-entry')).toHaveAttribute(
      'data-entry-type',
      'internal-note'
    );
  });

  it('falls back to "unknown" for an unrecognised entry type', () => {
    renderWithProviders(
      <TimelineEntry
        entry={makeEntry({
          entryType: 'Mystery' as TimelineStreamEntryResponse['entryType'],
        })}
      />
    );
    expect(screen.getByTestId('timeline-entry')).toHaveAttribute('data-entry-type', 'unknown');
    // Not a system log → actions footer present.
    expect(screen.queryByTestId('timeline-entry-actions')).toBeInTheDocument();
  });

  it('hides reactions and actions for a system-log entry', () => {
    renderWithProviders(
      <TimelineEntry
        entry={makeEntry({ entryType: TimelineEntryType.SystemLog, reactions })}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByTestId('timeline-entry')).toHaveAttribute('data-entry-type', 'system-log');
    expect(screen.queryByTestId('timeline-entry-actions')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="reaction-strip"]')).toBeNull();
  });

  it('renders the edited badge only when editedAt is set', () => {
    const { rerender } = renderWithProviders(<TimelineEntry entry={makeEntry()} />);
    expect(screen.queryByTestId('timeline-entry-edited-badge')).not.toBeInTheDocument();
    rerender(
      <TimelineEntry entry={makeEntry({ editedAt: toISODateString('2026-05-10T10:00:00Z') })} />
    );
    expect(screen.getByTestId('timeline-entry-edited-badge')).toBeInTheDocument();
  });

  it('applies a left margin when depth > 0', () => {
    renderWithProviders(<TimelineEntry entry={makeEntry()} depth={2} />);
    const article = screen.getByTestId('timeline-entry');
    expect(article).toHaveAttribute('data-depth', '2');
    expect(article).toHaveStyle({ marginLeft: '48px' });
  });

  it('renders body through a custom renderBody callback', () => {
    const renderBody = vi.fn((body: string) => <em data-testid="custom-body">{body}</em>);
    renderWithProviders(<TimelineEntry entry={makeEntry()} renderBody={renderBody} />);
    expect(screen.getByTestId('custom-body')).toBeInTheDocument();
    expect(renderBody).toHaveBeenCalledWith('Account created and initial roles assigned.');
  });

  it('shows "System" and a fallback avatar when author info is missing', () => {
    renderWithProviders(<TimelineEntry entry={makeEntry({ authorId: null, authorName: null })} />);
    expect(screen.getByTestId('timeline-entry-author')).toHaveTextContent('System');
    expect(screen.getByTestId('timeline-entry-avatar')).toBeInTheDocument();
  });

  it.each([
    ['System Admin', 'SA'],
    ['Alice', 'A'],
    ['   ', '?'],
  ])('derives initials %s -> %s', (authorName, expected) => {
    renderWithProviders(<TimelineEntry entry={makeEntry({ authorName })} />);
    expect(screen.getByTestId('timeline-entry-avatar')).toHaveTextContent(expected);
  });

  describe('action callbacks', () => {
    it('does not render any action button when no callbacks are passed', () => {
      renderWithProviders(<TimelineEntry entry={makeEntry()} />);
      expect(screen.queryByTestId('timeline-reply-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('timeline-edit-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('timeline-delete-btn')).not.toBeInTheDocument();
    });

    it('fires onReply with the entry id', async () => {
      const onReply = vi.fn();
      const { user } = renderWithProviders(<TimelineEntry entry={makeEntry()} onReply={onReply} />);
      await user.click(screen.getByTestId('timeline-reply-btn'));
      expect(onReply).toHaveBeenCalledWith('tl-1');
    });

    it('fires onEdit with id, body and entry type', async () => {
      const onEdit = vi.fn();
      const { user } = renderWithProviders(<TimelineEntry entry={makeEntry()} onEdit={onEdit} />);
      await user.click(screen.getByTestId('timeline-edit-btn'));
      expect(onEdit).toHaveBeenCalledWith(
        'tl-1',
        'Account created and initial roles assigned.',
        TimelineEntryType.Comment
      );
    });

    it('fires onDelete with the entry id', async () => {
      const onDelete = vi.fn();
      const { user } = renderWithProviders(
        <TimelineEntry entry={makeEntry()} onDelete={onDelete} />
      );
      await user.click(screen.getByTestId('timeline-delete-btn'));
      expect(onDelete).toHaveBeenCalledWith('tl-1');
    });
  });

  describe('read-only reaction strip', () => {
    it('renders a non-interactive strip when canReact is false', () => {
      renderWithProviders(<TimelineEntry entry={makeEntry({ reactions })} />);
      const strip = document.querySelector('[data-slot="reaction-strip"]');
      expect(strip).not.toBeNull();
      const chip = strip?.querySelector('button[data-emoji]');
      expect(chip).toHaveAttribute('disabled');
      // No add-reaction picker in read-only mode.
      expect(document.querySelector('[data-granit-reaction-strip-picker]')).toBeNull();
    });

    it('renders a read-only strip when canReact is true but entity context is missing', () => {
      renderWithProviders(<TimelineEntry entry={makeEntry({ reactions })} canReact />);
      const chip = document.querySelector('[data-slot="reaction-strip"] button[data-emoji]');
      expect(chip).toHaveAttribute('disabled');
    });
  });

  describe('interactive reaction bar', () => {
    it('renders an interactive strip and toggles a native-origin reaction', async () => {
      const onReactionToggled = vi.fn();
      const { user } = renderWithProviders(
        <TimelineEntry
          entry={makeEntry({ reactions })}
          entityType="User"
          entityId="user-001"
          canReact
          onReactionToggled={onReactionToggled}
        />
      );
      const chip = document.querySelector<HTMLButtonElement>(
        '[data-slot="reaction-strip"] button[data-emoji]'
      );
      expect(chip).not.toBeNull();
      expect(chip).not.toHaveAttribute('disabled');
      // Picker present in interactive mode.
      expect(document.querySelector('[data-granit-reaction-strip-picker]')).not.toBeNull();

      await user.click(chip!);

      // Native origin → no anchor materialisation, direct toggle.
      expect(hoisted.mutateAsync).not.toHaveBeenCalled();
      await waitFor(() => expect(hoisted.mutate).toHaveBeenCalled());
      expect(hoisted.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'User',
          entityId: 'user-001',
          entryId: 'tl-1',
          emoji: THUMBS_UP,
        }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      // onSuccess relayed to the consumer callback.
      await waitFor(() => expect(onReactionToggled).toHaveBeenCalledWith('tl-1', toggleResult));
    });

    it('materialises the anchor shadow id for an external-origin entry', async () => {
      const { user } = renderWithProviders(
        <TimelineEntry
          entry={makeEntry({
            reactions,
            origin: TimelineEntryOrigin.External,
            sourceKey: 'auditing',
            sourceId: 'audit-42',
          })}
          entityType="User"
          entityId="user-001"
          canReact
        />
      );
      const chip = document.querySelector<HTMLButtonElement>(
        '[data-slot="reaction-strip"] button[data-emoji]'
      );
      await user.click(chip!);

      await waitFor(() =>
        expect(hoisted.mutateAsync).toHaveBeenCalledWith({
          entityType: 'User',
          entityId: 'user-001',
          sourceKey: 'auditing',
          sourceId: 'audit-42',
        })
      );
      // Toggle then targets the resolved shadow id, keeping the original entryId
      // for the local cache patch relayed back via onSuccess.
      await waitFor(() =>
        expect(hoisted.mutate).toHaveBeenCalledWith(
          expect.objectContaining({ entryId: 'tl-shadow' }),
          expect.any(Object)
        )
      );
    });

    it('treats an external entry without source coordinates as non-anchored', async () => {
      const { user } = renderWithProviders(
        <TimelineEntry
          entry={makeEntry({
            reactions,
            origin: TimelineEntryOrigin.External,
            sourceKey: '',
            sourceId: null,
          })}
          entityType="User"
          entityId="user-001"
          canReact
        />
      );
      const chip = document.querySelector<HTMLButtonElement>(
        '[data-slot="reaction-strip"] button[data-emoji]'
      );
      await user.click(chip!);

      await waitFor(() => expect(hoisted.mutate).toHaveBeenCalled());
      expect(hoisted.mutateAsync).not.toHaveBeenCalled();
      expect(hoisted.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ entryId: 'tl-1' }),
        expect.any(Object)
      );
    });

    it('renders an interactive strip with no chips when reactions are null', () => {
      renderWithProviders(
        <TimelineEntry
          entry={makeEntry({ reactions: null })}
          entityType="User"
          entityId="user-001"
          canReact
        />
      );
      // Interactive (picker present) but no reaction chips to click.
      expect(document.querySelector('[data-granit-reaction-strip-picker]')).not.toBeNull();
      expect(document.querySelector('[data-slot="reaction-strip"] button[data-emoji]')).toBeNull();
      expect(hoisted.mutate).not.toHaveBeenCalled();
    });

    it('toggles without a consumer callback (onReactionToggled omitted)', async () => {
      const { user } = renderWithProviders(
        <TimelineEntry
          entry={makeEntry({ reactions })}
          entityType="User"
          entityId="user-001"
          canReact
        />
      );
      const chip = document.querySelector<HTMLButtonElement>(
        '[data-slot="reaction-strip"] button[data-emoji]'
      );
      await user.click(chip!);
      await waitFor(() => expect(hoisted.mutate).toHaveBeenCalled());
    });
  });
});
