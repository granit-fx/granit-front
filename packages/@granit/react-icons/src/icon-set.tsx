import { Component } from 'react';

import type { LucideIcon } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

/**
 * A glyph — a `lucide-react` icon (or any component with the same props shape,
 * e.g. a custom brand glyph built with lucide's `Icon` factory). Typed as
 * `LucideIcon` so consumers can forward the full SVG prop surface (`size`,
 * `aria-hidden`, `style`, `data-slot`, …) to the resolved glyph.
 */
export type IconGlyph = LucideIcon;

/** Props of the renderer returned by {@link createIconRegistry}. */
export type IconProps = {
  /** Identifier to resolve; `null`/`undefined`/unknown renders the fallback. */
  readonly name: string | null | undefined;
  readonly className?: string;
};

// ---------------------------------------------------------------------------
// Data-driven icon primitive
// ---------------------------------------------------------------------------
//
// Admin UIs routinely store an *icon identifier string* in backend data
// (a workspace's icon, a prompt's glyph, a CMS icon block) and render it on the
// front — an icon is often more legible than a label. Resolving that string to
// a glyph, with a fallback, is the same logic every time; these factories own
// it so each domain only declares its own vocabulary.
//
// Two shapes, by who controls the vocabulary:
//   • createIconSet      — BOUNDED/static set the package owns (a curated
//                          palette, or a map mirroring a backend enum).
//   • createIconRegistry — OPEN/mutable set the *host* fills at runtime, when
//                          the names are backend-assigned and not enumerable at
//                          build time.
//
// Neither pulls in `lucide-react/dynamic`'s ~1762-entry lazy import map: glyphs
// are statically referenced, so the bundler tree-shakes to only those used.

/** A bounded, statically-defined icon set: a curated name→glyph map. */
export type IconSet<TName extends string = string> = {
  /** Every registered identifier — e.g. to render a picker grid. */
  readonly ids: readonly TName[];
  /** Resolve a name to its glyph; `null`/unknown falls back to the set default. */
  resolve(name: string | null | undefined): IconGlyph;
};

/**
 * Build a bounded icon set from a static map plus a default key. Use when the
 * package owns the vocabulary (a front-defined palette, or a map kept in sync
 * with a backend enum).
 */
export function createIconSet<TName extends string>(
  icons: Record<TName, IconGlyph>,
  options: { readonly fallback: NoInfer<TName> }
): IconSet<TName> {
  const ids = Object.keys(icons) as TName[];
  const fallbackGlyph = icons[options.fallback];
  return {
    ids,
    resolve: (name) => (name && icons[name as TName]) || fallbackGlyph,
  };
}

/** An open, mutable icon registry filled by the host at runtime. */
export type IconRegistry = {
  /** Merge icons (keyed by identifier) into the registry. */
  register(icons: Record<string, IconGlyph>): void;
  /** Install a catch-all consulted for names absent from the registry; `null` clears it. */
  setFallback(resolver: ((name: string) => IconGlyph | undefined) | null): void;
  /** Resolve a name to its glyph, or `undefined` if unknown (no static fallback). */
  resolve(name: string): IconGlyph | undefined;
  /**
   * Renderer: resolves `name`, falls back to the registry's fallback glyph for
   * null/unknown, and catches a throwing glyph (e.g. an opt-in dynamic
   * resolver's "name not found") via an error boundary.
   */
  Icon: ComponentType<IconProps>;
};

/**
 * Build an open icon registry. The host registers exactly its backend's icon
 * vocabulary (via static imports → tree-shaken); unknown names render
 * `options.fallback`.
 */
export function createIconRegistry(options: { readonly fallback: IconGlyph }): IconRegistry {
  const registry = new Map<string, IconGlyph>();
  let fallbackResolver: ((name: string) => IconGlyph | undefined) | null = null;
  const FallbackGlyph = options.fallback;

  const resolve = (name: string): IconGlyph | undefined =>
    registry.get(name) ?? fallbackResolver?.(name);

  function Icon({ name, className }: IconProps) {
    const fallback = <FallbackGlyph className={className} />;
    if (!name) return fallback;
    const Glyph = resolve(name);
    if (!Glyph) return fallback;
    return (
      <IconErrorBoundary fallback={fallback}>
        <Glyph className={className} />
      </IconErrorBoundary>
    );
  }

  return {
    register(icons) {
      for (const [name, glyph] of Object.entries(icons)) registry.set(name, glyph);
    },
    setFallback(resolver) {
      fallbackResolver = resolver;
    },
    resolve,
    Icon,
  };
}

// Catches a throwing glyph (the open registry's optional dynamic resolver can
// throw on an unknown name) and renders the fallback. Class component required
// by React's error-boundary API.
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
