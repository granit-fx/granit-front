import { render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useReverseInfiniteScroll } from '../hooks/use-reverse-infinite-scroll';

/** Minimal IntersectionObserver stand-in whose intersection we drive by hand. */
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  private readonly cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  trigger(isIntersecting: boolean): void {
    this.cb(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

/** Give a jsdom element controllable scrollHeight + read/write scrollTop. */
function defineMetrics(el: HTMLElement) {
  let height = 1000;
  let top = 0;
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v;
    },
  });
  return { setHeight: (h: number) => (height = h), getTop: () => top };
}

interface HarnessProps {
  readonly itemCount: number;
  readonly hasMoreOlder: boolean;
  readonly isLoadingOlder: boolean;
  readonly loadOlder: () => void;
}

function Harness({ itemCount, hasMoreOlder, isLoadingOlder, loadOlder }: HarnessProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useReverseInfiniteScroll({
    scrollContainerRef: scrollRef,
    topSentinelRef: sentinelRef,
    itemCount,
    hasMoreOlder,
    isLoadingOlder,
    loadOlder,
  });
  return (
    <div ref={scrollRef} data-testid="scroll">
      <div ref={sentinelRef} data-testid="sentinel" />
    </div>
  );
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useReverseInfiniteScroll', () => {
  it('loads older on intersect and pins the viewport by the prepended height delta', () => {
    const loadOlder = vi.fn();
    const { rerender, getByTestId } = render(
      <Harness itemCount={2} hasMoreOlder isLoadingOlder={false} loadOlder={loadOlder} />
    );
    const metrics = defineMetrics(getByTestId('scroll'));

    // Sentinel enters view → request older page, capturing the pre-load height.
    MockIntersectionObserver.instances[0]?.trigger(true);
    expect(loadOlder).toHaveBeenCalledTimes(1);

    // Older page commits: content grew by 400px and the item count went up.
    metrics.setHeight(1400);
    rerender(<Harness itemCount={4} hasMoreOlder isLoadingOlder={false} loadOlder={loadOlder} />);

    // Viewport pinned: scrollTop offset by the height delta (0 → 400).
    expect(metrics.getTop()).toBe(400);
  });

  it('does not request another page while one is already loading', () => {
    const loadOlder = vi.fn();
    const { getByTestId } = render(
      <Harness itemCount={2} hasMoreOlder isLoadingOlder loadOlder={loadOlder} />
    );
    defineMetrics(getByTestId('scroll'));

    MockIntersectionObserver.instances[0]?.trigger(true);

    expect(loadOlder).not.toHaveBeenCalled();
  });

  it('does not request a page when there are no older messages', () => {
    const loadOlder = vi.fn();
    const { getByTestId } = render(
      <Harness itemCount={2} hasMoreOlder={false} isLoadingOlder={false} loadOlder={loadOlder} />
    );
    defineMetrics(getByTestId('scroll'));

    MockIntersectionObserver.instances[0]?.trigger(true);

    expect(loadOlder).not.toHaveBeenCalled();
  });
});
