import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CmsMenuNav } from '../components/cms-menu-nav';

import type { ResolvedMenu } from '@granit/cms';

function menu(overrides: Partial<ResolvedMenu> = {}): ResolvedMenu {
  return {
    key: 'main',
    title: 'Main Navigation',
    culture: 'fr',
    items: [],
    ...overrides,
  };
}

describe('CmsMenuNav', () => {
  it('renders a nav with aria-label from menu title', () => {
    render(<CmsMenuNav menu={menu()} />);
    expect(screen.getByRole('navigation', { name: 'Main Navigation' })).toBeInTheDocument();
  });

  it('renders a Page item as an anchor link', () => {
    render(
      <CmsMenuNav
        menu={menu({
          items: [{ label: 'Accueil', kind: 'Page', href: '/fr/home', children: [] }],
        })}
      />
    );
    const link = screen.getByRole('link', { name: 'Accueil' });
    expect(link).toHaveAttribute('href', '/fr/home');
    expect(link).not.toHaveAttribute('target');
  });

  it('renders an ExternalUrl item with target=_blank and rel', () => {
    render(
      <CmsMenuNav
        menu={menu({
          items: [
            {
              label: 'External',
              kind: 'ExternalUrl',
              href: 'https://example.com',
              children: [],
            },
          ],
        })}
      />
    );
    const link = screen.getByRole('link', { name: 'External' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a None item as a span (no link)', () => {
    render(
      <CmsMenuNav
        menu={menu({
          items: [{ label: 'Section', kind: 'None', href: null, children: [] }],
        })}
      />
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Section')).toBeInTheDocument();
  });

  it('renders an Anchor item with null href as a span', () => {
    render(
      <CmsMenuNav
        menu={menu({
          items: [{ label: 'Top', kind: 'Anchor', href: null, children: [] }],
        })}
      />
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Top')).toBeInTheDocument();
  });

  it('renders an Anchor item with href as a link', () => {
    render(
      <CmsMenuNav
        menu={menu({
          items: [{ label: 'Top', kind: 'Anchor', href: '#top', children: [] }],
        })}
      />
    );
    expect(screen.getByRole('link', { name: 'Top' })).toHaveAttribute('href', '#top');
  });

  it('applies cssClass to the item element', () => {
    const { container } = render(
      <CmsMenuNav
        menu={menu({
          items: [{ label: 'Styled', kind: 'Page', href: '/fr', children: [], cssClass: 'active' }],
        })}
      />
    );
    expect(container.querySelector('.active')).not.toBeNull();
  });

  it('renders nested children recursively', () => {
    render(
      <CmsMenuNav
        menu={menu({
          items: [
            {
              label: 'Parent',
              kind: 'Page',
              href: '/fr/parent',
              children: [{ label: 'Child', kind: 'Page', href: '/fr/parent/child', children: [] }],
            },
          ],
        })}
      />
    );
    expect(screen.getByRole('link', { name: 'Parent' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Child' })).toBeInTheDocument();
  });

  it('does not render a nested list when children is empty', () => {
    const { container } = render(
      <CmsMenuNav
        menu={menu({
          items: [{ label: 'Solo', kind: 'Page', href: '/fr', children: [] }],
        })}
      />
    );
    // Only one <ul> — the root list, no nested list
    expect(container.querySelectorAll('ul').length).toBe(1);
  });

  it('forwards className to the nav element', () => {
    render(<CmsMenuNav menu={menu()} className="custom-nav" />);
    expect(screen.getByRole('navigation').className).toContain('custom-nav');
  });
});
