import { toISODateString } from '@granit/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoryBreadcrumb } from '../components/category-breadcrumb.tsx';

import type { CategoryDetailResponse, CategoryResponse } from '@granit/taxonomy';

const root: CategoryResponse = {
  id: 'cat-1',
  tenantId: null,
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: true,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

const leaf: CategoryResponse = {
  id: 'cat-2',
  tenantId: null,
  scope: 'documents',
  parentId: 'cat-1',
  path: '/legal/contracts',
  name: 'contracts',
  depth: 1,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

const detail: CategoryDetailResponse = { ...leaf, breadcrumb: [root, leaf] };

describe('CategoryBreadcrumb', () => {
  it('renders root → leaf segments separated by the chevron', () => {
    const { container } = render(<CategoryBreadcrumb category={detail} />);
    const segments = container.querySelectorAll('[data-granit-category-breadcrumb-segment]');
    expect(segments).toHaveLength(2);
    expect(segments[0]?.textContent).toContain('legal');
    expect(segments[1]?.textContent).toContain('contracts');
  });

  it('marks the leaf segment with aria-current="page"', () => {
    render(<CategoryBreadcrumb category={detail} />);
    const current = screen.getByText('contracts');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('makes non-leaf segments clickable when onSelect is provided', async () => {
    const onSelect = vi.fn();
    render(<CategoryBreadcrumb category={detail} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'legal' }));
    expect(onSelect).toHaveBeenCalledWith(root);
  });
});
