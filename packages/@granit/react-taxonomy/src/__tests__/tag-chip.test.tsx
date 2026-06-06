import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagChip } from '../components/tag-chip.tsx';

import type { TagResponse } from '@granit/taxonomy';

const sampleTag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  updatedAt: '2026-05-01T08:00:00Z',
};

describe('TagChip', () => {
  it('renders the tag name with its background color', () => {
    const { container } = render(<TagChip tag={sampleTag} />);
    const chip = container.querySelector('[data-granit-tag-chip]') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('omits the remove button when no onRemove is supplied', () => {
    render(<TagChip tag={sampleTag} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onRemove when the remove button is clicked', async () => {
    const onRemove = vi.fn();
    render(<TagChip tag={sampleTag} onRemove={onRemove} removeLabel="Remove" />);

    await userEvent.click(screen.getByRole('button', { name: /Remove Urgent/i }));
    expect(onRemove).toHaveBeenCalledWith(sampleTag);
  });

  it('falls back to dark text on a light background', () => {
    const { container } = render(
      <TagChip tag={{ ...sampleTag, id: 't-light', color: '#FFFFFF' }} />
    );
    const chip = container.querySelector('[data-granit-tag-chip]') as HTMLElement;
    expect(chip.style.color).toBe('rgb(17, 24, 39)');
  });

  it('uses light text on a dark background', () => {
    const { container } = render(
      <TagChip tag={{ ...sampleTag, id: 't-dark', color: '#000000' }} />
    );
    const chip = container.querySelector('[data-granit-tag-chip]') as HTMLElement;
    expect(chip.style.color).toBe('rgb(255, 255, 255)');
  });

  it('uses fallback dark text on malformed hex input', () => {
    const { container } = render(
      <TagChip tag={{ ...sampleTag, color: 'not-a-hex' as TagResponse['color'] }} />
    );
    const chip = container.querySelector('[data-granit-tag-chip]') as HTMLElement;
    expect(chip.style.color).toBe('rgb(17, 24, 39)');
  });

  it('marks chips with hideOnEntityCard via a data attribute', () => {
    const { container } = render(<TagChip tag={{ ...sampleTag, hideOnEntityCard: true }} />);
    expect(
      container.querySelector('[data-granit-tag-chip][data-granit-tag-hidden-on-card]')
    ).toBeTruthy();
  });
});
