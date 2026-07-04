import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from './__tests__/test-utils';
import { TimelineStream } from './timeline-stream';

import type { TimelineEntryProps } from './timeline-entry';
import type { TimelineStreamEntryResponse, TimelineEntryId } from '@granit/timeline';
import type { ISODateString } from '@granit/types';

let seq = 0;

function makeEntry(
  overrides: Partial<TimelineStreamEntryResponse> = {}
): TimelineStreamEntryResponse {
  seq += 1;
  return {
    id: `e-${seq}` as TimelineEntryId,
    occurredAt: '2026-01-01T00:00:00Z' as ISODateString,
    entryType: 'Comment',
    authorId: null,
    authorName: 'Alice',
    body: 'Hello world',
    attachments: [],
    parentEntryId: null,
    ...overrides,
  };
}

/** Captures the props each entry is rendered with, bypassing the real
 * <TimelineEntry> so branch logic (threading depth, onEdit gating,
 * context forwarding) can be asserted directly on the forwarded props. */
function makeCapture() {
  const captured: TimelineEntryProps[] = [];
  const renderEntry = (props: TimelineEntryProps) => {
    captured.push(props);
    return (
      <div data-testid="custom-entry" data-entry-id={props.entry.id} data-depth={props.depth} />
    );
  };
  return { captured, renderEntry };
}

describe('TimelineStream', () => {
  it('renders the loading state with a spinner and no entries', () => {
    const { renderEntry, captured } = makeCapture();
    const { container } = renderWithProviders(
      <TimelineStream entries={[makeEntry()]} loading renderEntry={renderEntry} />
    );
    const output = container.querySelector('output[aria-label="Loading timeline"]');
    expect(output).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline-loading"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline-stream"]')).toBeNull();
    expect(captured).toHaveLength(0);
  });

  it('forwards className onto the loading output', () => {
    const { container } = renderWithProviders(
      <TimelineStream entries={[]} loading className="my-loader" />
    );
    expect(container.querySelector('output.my-loader')).not.toBeNull();
  });

  it('renders the empty state with the default message when there are no entries', () => {
    const { container } = renderWithProviders(<TimelineStream entries={[]} />);
    const empty = container.querySelector('[data-testid="timeline-empty"]');
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toBe('No entries yet.');
  });

  it('renders a custom empty message', () => {
    const { container } = renderWithProviders(
      <TimelineStream entries={[]} emptyMessage="Nothing here" className="empty-cls" />
    );
    const empty = container.querySelector('[data-testid="timeline-empty"]');
    expect(empty?.textContent).toBe('Nothing here');
    expect(empty?.classList.contains('empty-cls')).toBe(true);
  });

  it('treats a stream whose entries are all unreachable orphans as empty', () => {
    // parentEntryId points at an id that is not itself an entry → dropped.
    const orphan = makeEntry({ parentEntryId: 'missing-parent' as TimelineEntryId });
    const { container } = renderWithProviders(<TimelineStream entries={[orphan]} />);
    expect(container.querySelector('[data-testid="timeline-empty"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline-stream"]')).toBeNull();
  });

  it('flattens the thread depth-first and assigns increasing depth to descendants', () => {
    const root = makeEntry({ body: 'root' });
    const child = makeEntry({ parentEntryId: root.id, body: 'child' });
    const grandchild = makeEntry({ parentEntryId: child.id, body: 'grandchild' });
    const secondRoot = makeEntry({ body: 'root2' });
    const { renderEntry, captured } = makeCapture();
    renderWithProviders(
      <TimelineStream entries={[root, child, grandchild, secondRoot]} renderEntry={renderEntry} />
    );
    expect(captured.map((p) => p.entry.body)).toEqual(['root', 'child', 'grandchild', 'root2']);
    expect(captured.map((p) => p.depth)).toEqual([0, 1, 2, 0]);
  });

  it('renders each entry through renderEntry inside the timeline-stream section', () => {
    const { renderEntry } = makeCapture();
    const { container } = renderWithProviders(
      <TimelineStream entries={[makeEntry(), makeEntry()]} renderEntry={renderEntry} />
    );
    const section = container.querySelector('[data-testid="timeline-stream"]');
    expect(section?.getAttribute('aria-label')).toBe('Timeline');
    expect(container.querySelectorAll('[data-testid="custom-entry"]')).toHaveLength(2);
  });

  it('renders the built-in TimelineEntry when no renderEntry is provided', () => {
    const { container } = renderWithProviders(
      <TimelineStream entries={[makeEntry({ body: 'native render' })]} />
    );
    const entries = container.querySelectorAll('[data-testid="timeline-entry"]');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.getAttribute('data-depth')).toBe('0');
    expect(container.textContent).toContain('native render');
  });

  it('forwards stream context (entityType, entityId, canReact, renderBody) to each entry', () => {
    const { renderEntry, captured } = makeCapture();
    const renderBody = (body: string) => <span>{body}</span>;
    renderWithProviders(
      <TimelineStream
        entries={[makeEntry()]}
        entityType="User"
        entityId="u-1"
        canReact
        renderBody={renderBody}
        renderEntry={renderEntry}
      />
    );
    const props = captured[0];
    expect(props?.entityType).toBe('User');
    expect(props?.entityId).toBe('u-1');
    expect(props?.canReact).toBe(true);
    expect(props?.renderBody).toBe(renderBody);
  });

  it('does not forward onEdit when the callback is absent', () => {
    const { renderEntry, captured } = makeCapture();
    renderWithProviders(<TimelineStream entries={[makeEntry()]} renderEntry={renderEntry} />);
    expect(captured[0]?.onEdit).toBeUndefined();
  });

  it('forwards onEdit to every entry when no canEdit predicate is supplied', () => {
    const onEdit = vi.fn();
    const { renderEntry, captured } = makeCapture();
    renderWithProviders(
      <TimelineStream
        entries={[makeEntry(), makeEntry()]}
        onEdit={onEdit}
        renderEntry={renderEntry}
      />
    );
    expect(captured.every((p) => p.onEdit === onEdit)).toBe(true);
  });

  it('gates onEdit per entry via the canEdit predicate', () => {
    const onEdit = vi.fn();
    const editable = makeEntry({ body: 'editable' });
    const locked = makeEntry({ body: 'locked' });
    const canEdit = vi.fn((entry: TimelineStreamEntryResponse) => entry.body === 'editable');
    const { renderEntry, captured } = makeCapture();
    renderWithProviders(
      <TimelineStream
        entries={[editable, locked]}
        onEdit={onEdit}
        canEdit={canEdit}
        renderEntry={renderEntry}
      />
    );
    expect(canEdit).toHaveBeenCalledTimes(2);
    expect(captured[0]?.onEdit).toBe(onEdit);
    expect(captured[1]?.onEdit).toBeUndefined();
  });

  it('omits the load-more control when hasMore is false', () => {
    const { renderEntry } = makeCapture();
    const { container } = renderWithProviders(
      <TimelineStream entries={[makeEntry()]} renderEntry={renderEntry} />
    );
    expect(container.querySelector('[data-testid="timeline-load-more"]')).toBeNull();
  });

  it('shows an enabled load-more button and fires onLoadMore on click', () => {
    const onLoadMore = vi.fn();
    const { renderEntry } = makeCapture();
    const { container } = renderWithProviders(
      <TimelineStream
        entries={[makeEntry()]}
        hasMore
        onLoadMore={onLoadMore}
        renderEntry={renderEntry}
      />
    );
    const btn = container.querySelector(
      '[data-testid="timeline-load-more-btn"]'
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Load more');
    fireEvent.click(btn);
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('disables the load-more button and swaps the label while loadingMore', () => {
    const { renderEntry } = makeCapture();
    const { container } = renderWithProviders(
      <TimelineStream entries={[makeEntry()]} hasMore loadingMore renderEntry={renderEntry} />
    );
    const btn = container.querySelector(
      '[data-testid="timeline-load-more-btn"]'
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Loading');
  });

  it('does not throw when load-more is clicked without an onLoadMore handler', () => {
    const { renderEntry } = makeCapture();
    const { container } = renderWithProviders(
      <TimelineStream entries={[makeEntry()]} hasMore renderEntry={renderEntry} />
    );
    const btn = container.querySelector(
      '[data-testid="timeline-load-more-btn"]'
    ) as HTMLButtonElement;
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
