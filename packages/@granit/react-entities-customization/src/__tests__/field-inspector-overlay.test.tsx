import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FieldInspectorOverlay, RESOLUTION_LAYERS } from '../components/field-inspector-overlay.js';

import type { FieldResolutionEntry } from '../components/field-inspector-overlay.js';

describe('FieldInspectorOverlay', () => {
  it('always renders the full 5-layer chain even when entries are sparse', () => {
    render(
      <FieldInspectorOverlay
        fieldName="amount"
        entries={[{ layer: 'Layer1Admin', winning: true, summary: 'Hidden' }]}
      />
    );
    const layers = document.querySelectorAll<HTMLElement>('[data-granit-field-inspector-layer]');
    expect(layers.length).toBe(RESOLUTION_LAYERS.length);
    expect([...layers].map((l) => l.dataset.layer)).toEqual([
      'Layer1Admin',
      'Layer2Workspace',
      'Layer3Role',
      'Layer4User',
      'Layer5Schema',
    ]);
  });

  it('marks the winning layer with data-winning and the badge', () => {
    const entries: readonly FieldResolutionEntry[] = [
      { layer: 'Layer1Admin', winning: true, summary: 'Hidden' },
      { layer: 'Layer5Schema', winning: false, summary: 'Default visible' },
    ];
    render(<FieldInspectorOverlay fieldName="amount" entries={entries} />);

    const winningRow = document.querySelector<HTMLElement>(
      '[data-granit-field-inspector-layer][data-winning]'
    );
    expect(winningRow?.dataset.layer).toBe('Layer1Admin');
    expect(document.querySelector('[data-granit-field-inspector-winning]')).not.toBeNull();
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<FieldInspectorOverlay fieldName="amount" entries={[]} onClose={onClose} />);
    fireEvent.click(document.querySelector('[data-granit-field-inspector-close]')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('omits the close button when onClose is not provided', () => {
    render(<FieldInspectorOverlay fieldName="amount" entries={[]} />);
    expect(document.querySelector('[data-granit-field-inspector-close]')).toBeNull();
  });
});
