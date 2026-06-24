import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createIconRegistry, createIconSet, type IconGlyph } from '../icon-set';

// A test glyph: a marker <span> forwarding its className. The primitive only
// imports `LucideIcon` as a type, so plain components stand in for real glyphs.
const glyph = (slot: string): IconGlyph =>
  (({ className }: { className?: string }) => (
    <span data-slot={slot} className={className} />
  )) as unknown as IconGlyph;

const Alpha = glyph('alpha');
const Beta = glyph('beta');
const Fallback = glyph('fallback');

describe('createIconSet', () => {
  const set = createIconSet({ alpha: Alpha, beta: Beta }, { fallback: 'alpha' });

  it('exposes every registered identifier via ids', () => {
    expect([...set.ids]).toEqual(['alpha', 'beta']);
  });

  it('resolves a known name to its glyph', () => {
    expect(set.resolve('beta')).toBe(Beta);
  });

  it('falls back to the default glyph for null', () => {
    expect(set.resolve(null)).toBe(Alpha);
  });

  it('falls back to the default glyph for undefined', () => {
    expect(set.resolve(undefined)).toBe(Alpha);
  });

  it('falls back to the default glyph for an unknown name', () => {
    expect(set.resolve('does-not-exist')).toBe(Alpha);
  });

  it('falls back to the default glyph for an empty string', () => {
    expect(set.resolve('')).toBe(Alpha);
  });
});

describe('createIconRegistry', () => {
  it('resolves a registered name to its glyph', () => {
    const registry = createIconRegistry({ fallback: Fallback });
    registry.register({ alpha: Alpha });
    expect(registry.resolve('alpha')).toBe(Alpha);
  });

  it('returns undefined for an unknown name with no fallback resolver', () => {
    const registry = createIconRegistry({ fallback: Fallback });
    expect(registry.resolve('nope')).toBeUndefined();
  });

  it('merges icons across successive register calls', () => {
    const registry = createIconRegistry({ fallback: Fallback });
    registry.register({ alpha: Alpha });
    registry.register({ beta: Beta });
    expect(registry.resolve('alpha')).toBe(Alpha);
    expect(registry.resolve('beta')).toBe(Beta);
  });

  it('consults the fallback resolver for names absent from the registry', () => {
    const registry = createIconRegistry({ fallback: Fallback });
    registry.setFallback((name) => (name === 'dynamic' ? Beta : undefined));
    expect(registry.resolve('dynamic')).toBe(Beta);
    expect(registry.resolve('still-unknown')).toBeUndefined();
  });

  it('prefers a registered icon over the fallback resolver', () => {
    const registry = createIconRegistry({ fallback: Fallback });
    registry.register({ alpha: Alpha });
    registry.setFallback(() => Beta);
    expect(registry.resolve('alpha')).toBe(Alpha);
  });

  it('clears the fallback resolver when set to null', () => {
    const registry = createIconRegistry({ fallback: Fallback });
    registry.setFallback(() => Beta);
    registry.setFallback(null);
    expect(registry.resolve('anything')).toBeUndefined();
  });

  describe('Icon renderer', () => {
    it('renders the fallback glyph when name is null', () => {
      const registry = createIconRegistry({ fallback: Fallback });
      render(<registry.Icon name={null} />);
      expect(document.querySelector('[data-slot="fallback"]')).not.toBeNull();
    });

    it('renders the fallback glyph for an unknown name', () => {
      const registry = createIconRegistry({ fallback: Fallback });
      render(<registry.Icon name="unknown" />);
      expect(document.querySelector('[data-slot="fallback"]')).not.toBeNull();
    });

    it('renders the resolved glyph for a known name and forwards className', () => {
      const registry = createIconRegistry({ fallback: Fallback });
      registry.register({ alpha: Alpha });
      render(<registry.Icon name="alpha" className="size-4" />);
      const icon = document.querySelector('[data-slot="alpha"]');
      expect(icon).not.toBeNull();
      expect(icon).toHaveClass('size-4');
      expect(document.querySelector('[data-slot="fallback"]')).toBeNull();
    });

    it('forwards className to the fallback glyph', () => {
      const registry = createIconRegistry({ fallback: Fallback });
      render(<registry.Icon name={undefined} className="size-5" />);
      expect(document.querySelector('[data-slot="fallback"]')).toHaveClass('size-5');
    });

    it('catches a throwing resolved glyph via the error boundary', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const Boom = (() => {
        throw new Error('glyph blew up');
      }) as unknown as IconGlyph;
      const registry = createIconRegistry({ fallback: Fallback });
      registry.setFallback(() => Boom);
      render(<registry.Icon name="boom" />);
      expect(document.querySelector('[data-slot="fallback"]')).not.toBeNull();
      spy.mockRestore();
    });
  });
});
