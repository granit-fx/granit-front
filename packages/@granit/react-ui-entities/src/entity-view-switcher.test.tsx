import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EntityViewSwitcher } from './entity-view-switcher';

import type { EntityListLayoutKind, EntityListLayoutManifest } from '@granit/entities';

function layout(kind: EntityListLayoutKind): EntityListLayoutManifest {
  return {
    kind,
    isDefault: false,
    kanban: null,
    calendar: null,
    gallery: null,
  };
}

const ALL: readonly EntityListLayoutManifest[] = [
  layout('List'),
  layout('Kanban'),
  layout('Calendar'),
  layout('Gallery'),
];

describe('EntityViewSwitcher', () => {
  it('renders nothing when no layouts are registered', () => {
    const { container } = render(
      <EntityViewSwitcher layouts={[]} activeKind="List" onChange={vi.fn()} />
    );
    expect(container.querySelector('[data-slot="entity-view-switcher"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only a single layout is registered', () => {
    const { container } = render(
      <EntityViewSwitcher layouts={[layout('List')]} activeKind="List" onChange={vi.fn()} />
    );
    expect(container.querySelector('[data-slot="entity-view-switcher"]')).toBeNull();
  });

  it('renders a tablist with one tab per layout when two or more are registered', () => {
    const { container } = render(
      <EntityViewSwitcher
        layouts={[layout('List'), layout('Kanban')]}
        activeKind="List"
        onChange={vi.fn()}
      />
    );
    const tablist = container.querySelector('[data-slot="entity-view-switcher"]');
    expect(tablist).not.toBeNull();
    expect(tablist?.getAttribute('role')).toBe('tablist');
    expect(tablist?.getAttribute('aria-label')).toBe('View');
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it('renders every kind with its icon and fallback label', () => {
    const { container } = render(
      <EntityViewSwitcher layouts={ALL} activeKind="List" onChange={vi.fn()} />
    );
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.querySelector('span')?.textContent)).toEqual([
      'List',
      'Kanban',
      'Calendar',
      'Gallery',
    ]);
    // Each tab renders exactly one Lucide icon (rendered as an <svg>).
    for (const tab of tabs) {
      expect(tab.querySelector('svg')).not.toBeNull();
    }
  });

  it('marks the active tab and leaves the others inactive', () => {
    const { container } = render(
      <EntityViewSwitcher layouts={ALL} activeKind="Calendar" onChange={vi.fn()} />
    );
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const [list, kanban, calendar, gallery] = tabs;

    expect(calendar.getAttribute('aria-selected')).toBe('true');
    expect(calendar.getAttribute('data-active')).toBe('true');
    expect(calendar.className).toContain('border-primary');
    expect(calendar.className).toContain('text-foreground');

    for (const tab of [list, kanban, gallery]) {
      expect(tab.getAttribute('aria-selected')).toBe('false');
      // data-active is set to `undefined` for inactive tabs → attribute absent.
      expect(tab.hasAttribute('data-active')).toBe(false);
      expect(tab.className).toContain('border-transparent');
      expect(tab.className).toContain('text-muted-foreground');
    }
  });

  it('invokes onChange with the clicked layout kind', () => {
    const onChange = vi.fn();
    const { container } = render(
      <EntityViewSwitcher layouts={ALL} activeKind="List" onChange={onChange} />
    );
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    fireEvent.click(tabs[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Kanban');

    fireEvent.click(tabs[3]);
    expect(onChange).toHaveBeenNthCalledWith(2, 'Gallery');
  });

  it('fires onChange even when the already-active tab is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <EntityViewSwitcher
        layouts={[layout('List'), layout('Kanban')]}
        activeKind="List"
        onChange={onChange}
      />
    );
    const activeTab = container.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    fireEvent.click(activeTab as HTMLButtonElement);
    expect(onChange).toHaveBeenCalledWith('List');
  });

  it('gives each tab button type=button', () => {
    const { container } = render(
      <EntityViewSwitcher layouts={ALL} activeKind="List" onChange={vi.fn()} />
    );
    for (const tab of container.querySelectorAll('[role="tab"]')) {
      expect(tab.getAttribute('type')).toBe('button');
    }
  });
});
