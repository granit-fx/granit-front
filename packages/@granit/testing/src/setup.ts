// ---------------------------------------------------------------------------
// Global test setup for @granit/* packages
// ---------------------------------------------------------------------------

import '@testing-library/jest-dom';

// ---------------------------------------------------------------------------
// jsdom polyfills for headless UI primitives (Radix, cmdk).
// jsdom implements no layout, so these APIs are missing; component tests that
// render Select / Popover / Command / Dialog need them. Each is installed only
// when absent (real DOM environments keep their native impl) and guarded so the
// file stays a no-op outside jsdom (e.g. node-only hook tests).
// ---------------------------------------------------------------------------

if (typeof globalThis.window !== 'undefined') {
  if (!('matchMedia' in globalThis.window)) {
    Object.defineProperty(globalThis.window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

  class IntersectionObserverStub {
    root = null;
    rootMargin = '';
    thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver ??=
    IntersectionObserverStub as unknown as typeof IntersectionObserver;

  const proto = globalThis.Element.prototype;
  proto.scrollIntoView ??= () => {};
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
}
