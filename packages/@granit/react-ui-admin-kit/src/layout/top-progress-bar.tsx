import * as React from 'react';

import { cn } from '@granit/utils';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

let suspenseCount = 0;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSuspenseCount = () => suspenseCount;

const notify = () => {
  for (const listener of listeners) listener();
};

export function RouteSuspenseSignal() {
  React.useEffect(() => {
    suspenseCount += 1;
    notify();
    return () => {
      suspenseCount -= 1;
      notify();
    };
  }, []);
  return null;
}

type ProgressState = 'idle' | 'loading' | 'done';

export function TopProgressBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const suspended = React.useSyncExternalStore(subscribe, getSuspenseCount, getSuspenseCount);
  const active = isFetching + isMutating + suspended > 0;

  const [state, setState] = React.useState<ProgressState>('idle');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (active && state === 'idle') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync progress to external query/mutation activity
      setState('loading');
      setProgress(8);
    } else if (!active && state === 'loading') {
      setState('done');
      setProgress(100);
    }
  }, [active, state]);

  React.useEffect(() => {
    if (state === 'loading') {
      const id = globalThis.setInterval(() => {
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.1 : p));
      }, 200);
      return () => globalThis.clearInterval(id);
    }
    if (state === 'done') {
      const id = globalThis.setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 350);
      return () => globalThis.clearTimeout(id);
    }
    return undefined;
  }, [state]);

  const visible = state !== 'idle';

  return (
    // Custom top-loading bar (nProgress-style). `<progress>` would be
    // ideal but its native styling cannot be themed reliably across
    // browsers; the visual fill is a child div animating its width.
    // NOSONAR(jsx-a11y/prefer-tag-over-role)
    <div
      data-slot="top-progress-bar"
      role="progressbar"
      aria-hidden={!visible}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className="bg-primary h-full transition-[width] duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow:
            '0 0 10px var(--color-primary, currentColor), 0 0 4px var(--color-primary, currentColor)',
        }}
      />
    </div>
  );
}
