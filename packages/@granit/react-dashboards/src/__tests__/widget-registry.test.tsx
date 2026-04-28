import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultWidgetRegistry } from '../registry/default-widget-registry.js';
import { WidgetRegistryProvider, useWidgetRegistry } from '../registry/widget-registry-context.js';
import { composeRegistries, type WidgetRegistry } from '../registry/widget-registry.js';

describe('composeRegistries', () => {
  it('merges entries from later registries over earlier ones', () => {
    const A: WidgetRegistry = { foo: () => null };
    const B: WidgetRegistry = { bar: () => null };
    const composed = composeRegistries(A, B);
    expect(Object.keys(composed)).toEqual(expect.arrayContaining(['foo', 'bar']));
  });

  it('lets later registries override earlier renderers for the same type', () => {
    const fallback = () => null;
    const override = () => null;
    const composed = composeRegistries({ foo: fallback }, { foo: override });
    expect(composed.foo).toBe(override);
  });

  it('returns a frozen object', () => {
    const composed = composeRegistries({ foo: () => null });
    expect(Object.isFrozen(composed)).toBe(true);
  });
});

describe('useWidgetRegistry', () => {
  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useWidgetRegistry())).toThrow(
      /must be used inside a <WidgetRegistryProvider>/
    );
  });

  it('returns the composed registry from the provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WidgetRegistryProvider registries={[defaultWidgetRegistry]}>
        {children}
      </WidgetRegistryProvider>
    );
    const { result } = renderHook(() => useWidgetRegistry(), { wrapper });
    expect(result.current.markdown).toBeDefined();
    expect(result.current.image).toBeDefined();
    expect(result.current.text).toBeDefined();
  });
});
