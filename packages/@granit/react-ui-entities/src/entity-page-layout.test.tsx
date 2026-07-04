import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntityPageLayout } from './entity-page-layout';

describe('EntityPageLayout', () => {
  it('renders only the body when no optional slots are supplied', () => {
    const { container } = render(
      <EntityPageLayout>
        <span data-testid="body">content</span>
      </EntityPageLayout>
    );
    const root = container.querySelector('[data-slot="entity-page-layout"]') as HTMLElement;
    expect(root).not.toBeNull();
    // Default width is `full` → padding classes applied on the shell root.
    expect(root.getAttribute('data-content-width')).toBe('full');
    expect(root.className).toContain('px-4');
    // No optional slots.
    expect(container.querySelector('[data-slot="entity-page-back"]')).toBeNull();
    expect(container.querySelector('[data-slot="entity-page-header"]')).toBeNull();
    expect(container.querySelector('[data-slot="entity-page-view-switcher"]')).toBeNull();
    expect(container.querySelector('[data-slot="entity-page-query-controls"]')).toBeNull();
    expect(container.querySelector('[data-slot="entity-page-pagination"]')).toBeNull();
    // Body always present.
    const body = container.querySelector('[data-slot="entity-page-body"]') as HTMLElement;
    expect(body).not.toBeNull();
    expect(body.textContent).toBe('content');
  });

  it('renders a string title as an <h1> and a string subtitle as a <p>', () => {
    const { container } = render(
      <EntityPageLayout title="Parties" subtitle="All records">
        <span>body</span>
      </EntityPageLayout>
    );
    const header = container.querySelector('[data-slot="entity-page-header"]') as HTMLElement;
    expect(header).not.toBeNull();
    const h1 = header.querySelector('h1');
    expect(h1?.textContent).toBe('Parties');
    const p = header.querySelector('p');
    expect(p?.textContent).toBe('All records');
  });

  it('renders a ReactNode title and ReactNode subtitle verbatim (no wrapping h1/p)', () => {
    const { container } = render(
      <EntityPageLayout
        title={<span data-testid="custom-title">T</span>}
        subtitle={<em data-testid="custom-subtitle">S</em>}
      >
        <span>body</span>
      </EntityPageLayout>
    );
    const header = container.querySelector('[data-slot="entity-page-header"]') as HTMLElement;
    expect(header.querySelector('h1')).toBeNull();
    expect(header.querySelector('[data-testid="custom-title"]')).not.toBeNull();
    expect(header.querySelector('p')).toBeNull();
    expect(header.querySelector('[data-testid="custom-subtitle"]')).not.toBeNull();
  });

  it('renders the header when only actions are supplied (no title / subtitle)', () => {
    const { container } = render(
      <EntityPageLayout actions={<button type="button">Create</button>}>
        <span>body</span>
      </EntityPageLayout>
    );
    expect(container.querySelector('[data-slot="entity-page-header"]')).not.toBeNull();
    const actions = container.querySelector('[data-slot="entity-page-actions"]') as HTMLElement;
    expect(actions).not.toBeNull();
    expect(actions.querySelector('button')?.textContent).toBe('Create');
    // No title / subtitle content.
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders the header when only a subtitle is supplied but omits the actions slot', () => {
    const { container } = render(
      <EntityPageLayout subtitle="hint">
        <span>body</span>
      </EntityPageLayout>
    );
    expect(container.querySelector('[data-slot="entity-page-header"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="entity-page-actions"]')).toBeNull();
  });

  it('renders the back slot when provided', () => {
    const { container } = render(
      <EntityPageLayout back={<button type="button">Back</button>}>
        <span>body</span>
      </EntityPageLayout>
    );
    const back = container.querySelector('[data-slot="entity-page-back"]') as HTMLElement;
    expect(back).not.toBeNull();
    expect(back.querySelector('button')?.textContent).toBe('Back');
  });

  it('renders the view switcher and query controls slots when provided', () => {
    const { container } = render(
      <EntityPageLayout
        viewSwitcher={<div data-testid="switcher" />}
        queryControls={<div data-testid="controls" />}
      >
        <span>body</span>
      </EntityPageLayout>
    );
    const switcher = container.querySelector(
      '[data-slot="entity-page-view-switcher"]'
    ) as HTMLElement;
    expect(switcher).not.toBeNull();
    expect(switcher.querySelector('[data-testid="switcher"]')).not.toBeNull();
    const controls = container.querySelector(
      '[data-slot="entity-page-query-controls"]'
    ) as HTMLElement;
    expect(controls).not.toBeNull();
    expect(controls.querySelector('[data-testid="controls"]')).not.toBeNull();
  });

  it('renders the pagination footer when provided', () => {
    const { container } = render(
      <EntityPageLayout pagination={<nav data-testid="pager" />}>
        <span>body</span>
      </EntityPageLayout>
    );
    const pagination = container.querySelector(
      '[data-slot="entity-page-pagination"]'
    ) as HTMLElement;
    expect(pagination).not.toBeNull();
    expect(pagination.querySelector('[data-testid="pager"]')).not.toBeNull();
  });

  it('applies no extra padding classes for the comfortable width', () => {
    const { container } = render(
      <EntityPageLayout contentWidth="comfortable">
        <span>body</span>
      </EntityPageLayout>
    );
    const root = container.querySelector('[data-slot="entity-page-layout"]') as HTMLElement;
    expect(root.getAttribute('data-content-width')).toBe('comfortable');
    expect(root.className).not.toContain('px-4');
  });

  it('applies no extra padding classes for the narrow width', () => {
    const { container } = render(
      <EntityPageLayout contentWidth="narrow">
        <span>body</span>
      </EntityPageLayout>
    );
    const root = container.querySelector('[data-slot="entity-page-layout"]') as HTMLElement;
    expect(root.getAttribute('data-content-width')).toBe('narrow');
    expect(root.className).not.toContain('px-4');
  });

  it('merges a custom className and honours a dataSlot override', () => {
    const { container } = render(
      <EntityPageLayout className="my-custom-class" dataSlot="custom-shell">
        <span>body</span>
      </EntityPageLayout>
    );
    expect(container.querySelector('[data-slot="entity-page-layout"]')).toBeNull();
    const root = container.querySelector('[data-slot="custom-shell"]') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.className).toContain('my-custom-class');
  });
});
