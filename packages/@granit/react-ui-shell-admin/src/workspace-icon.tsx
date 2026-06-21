import { Square } from 'lucide-react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { Component, useCallback } from 'react';

import type { ReactNode } from 'react';

// Error boundary that catches lucide DynamicIcon's "Name not found" throw and
// renders the fallback element instead. Class component required by React's API.
class IconErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// Renders any lucide icon by its kebab-case name as emitted by the backend
// workspace tree (`shield-user`, `users-round`, `monitor-smartphone`, …).
// Lazily loads the icon node and falls back to `Square` while loading, when
// the name is null, or when the name is not recognised by lucide-react.
export function WorkspaceIcon({
  name,
  className,
}: {
  readonly name: string | null;
  readonly className?: string;
}) {
  // `DynamicIcon.fallback` is a `() => JSX.Element` render hook (called only
  // while the icon node is loading), so it has to close over `className`.
  // `useCallback` keeps the identity stable across renders and silences
  // Sonar's "component-defined-inside-component" heuristic.
  const fallback = useCallback(() => <Square className={className} />, [className]);
  const squareFallback = <Square className={className} />;

  if (!name) return squareFallback;
  return (
    <IconErrorBoundary fallback={squareFallback}>
      <DynamicIcon name={name as IconName} className={className} fallback={fallback} />
    </IconErrorBoundary>
  );
}
