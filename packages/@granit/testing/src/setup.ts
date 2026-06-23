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
  // Runtime code reads `globalThis.matchMedia` (the idiomatic pattern across the
  // framework), while some libraries (e.g. sonner) read `window.matchMedia`.
  // Under vitest's jsdom env these two targets are not always the same object,
  // so stub both to keep the polyfill effective wherever it is consumed.
  const matchMediaStub = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  for (const target of [globalThis, globalThis.window]) {
    if (target !== undefined && !('matchMedia' in target)) {
      Object.defineProperty(target, 'matchMedia', { writable: true, value: matchMediaStub });
    }
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
